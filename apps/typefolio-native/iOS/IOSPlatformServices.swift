#if os(iOS)
import BackgroundTasks
import CoreText
import Foundation

enum SyncBackgroundTasks {
    static let refreshIdentifier = "com.syncfont.app.refresh"
}

final class IOSFontInstaller: FontInstalling {
    func installFont(data: Data, filename: String, expectedSHA256: String) async throws -> URL {
        let actualHash = sha256Hex(of: data)
        guard actualHash.lowercased() == expectedSHA256.lowercased() else {
            throw FontInstallError.hashMismatch
        }

        let safeName = sanitizeFilename(filename)
        guard !safeName.isEmpty else {
            throw FontInstallError.invalidFilename
        }

        let fileExtension = (safeName as NSString).pathExtension.lowercased()
        if fileExtension == "woff" || fileExtension == "woff2" {
            throw FontInstallError.unsupportedFontFormat
        }

        let fontsDirectory = try fontsStorageDirectory()
        try FileManager.default.createDirectory(at: fontsDirectory, withIntermediateDirectories: true)

        let destination = fontsDirectory.appendingPathComponent(safeName)
        try data.write(to: destination, options: .atomic)

        var registrationError: Unmanaged<CFError>?
        let registered = CTFontManagerRegisterFontsForURL(
            destination as CFURL,
            .persistent,
            &registrationError
        )

        if !registered {
            if let registrationError {
                throw registrationError.takeRetainedValue()
            }
            throw SyncFontError.invalidResponse
        }

        return destination
    }

    private func fontsStorageDirectory() throws -> URL {
        let base = try FileManager.default.url(
            for: .applicationSupportDirectory,
            in: .userDomainMask,
            appropriateFor: nil,
            create: true
        )
        return base.appendingPathComponent("Fonts", isDirectory: true)
    }
}

final class IOSSyncScheduler: SyncScheduling {
    private var timer: Timer?
    private var handler: (() async -> Void)?
    private var interval: TimeInterval = 30
    private static var sharedHandler: (() async -> Void)?
    private static var didRegisterBackgroundTask = false

    static func registerBackgroundTasksIfNeeded() {
        guard !didRegisterBackgroundTask else {
            return
        }
        didRegisterBackgroundTask = true

        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: SyncBackgroundTasks.refreshIdentifier,
            using: nil
        ) { task in
            guard let refreshTask = task as? BGAppRefreshTask else {
                task.setTaskCompleted(success: false)
                return
            }

            refreshTask.expirationHandler = {
                refreshTask.setTaskCompleted(success: false)
            }

            Task {
                await sharedHandler?()
                refreshTask.setTaskCompleted(success: true)
                scheduleBackgroundRefresh()
            }
        }
    }

    static func scheduleBackgroundRefresh() {
        let request = BGAppRefreshTaskRequest(identifier: SyncBackgroundTasks.refreshIdentifier)
        request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60)
        try? BGTaskScheduler.shared.submit(request)
    }

    func startPolling(interval: TimeInterval, handler: @escaping () async -> Void) {
        stopPolling()
        self.handler = handler
        self.interval = interval
        Self.sharedHandler = handler
        Self.registerBackgroundTasksIfNeeded()
        startForegroundTimer()
        Self.scheduleBackgroundRefresh()
    }

    func stopPolling() {
        timer?.invalidate()
        timer = nil
        handler = nil
        Self.sharedHandler = nil
        BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: SyncBackgroundTasks.refreshIdentifier)
    }

    func resumeForegroundPolling() {
        startForegroundTimer()
    }

    private func startForegroundTimer() {
        timer?.invalidate()
        guard let handler else {
            return
        }

        timer = Timer.scheduledTimer(withTimeInterval: interval, repeats: true) { _ in
            Task { await handler() }
        }
        if let timer {
            RunLoop.main.add(timer, forMode: .common)
        }
    }
}
#endif
