import Foundation

final class MacFontInstaller: FontInstalling {
    func installFont(data: Data, filename: String, expectedSHA256: String) async throws -> URL {
        let actualHash = sha256Hex(of: data)
        guard actualHash.lowercased() == expectedSHA256.lowercased() else {
            throw FontInstallError.hashMismatch
        }

        let safeName = sanitizeFilename(filename)
        guard !safeName.isEmpty else {
            throw FontInstallError.invalidFilename
        }

        let fontsDirectory = FileManager.default.homeDirectoryForCurrentUser
            .appendingPathComponent("Library/Fonts", isDirectory: true)

        try FileManager.default.createDirectory(at: fontsDirectory, withIntermediateDirectories: true)
        let destination = fontsDirectory.appendingPathComponent(safeName)
        try data.write(to: destination, options: .atomic)
        return destination
    }
}

final class MacSyncScheduler: SyncScheduling {
    private var timer: Timer?

    func startPolling(interval: TimeInterval, handler: @escaping () async -> Void) {
        stopPolling()
        timer = Timer.scheduledTimer(withTimeInterval: interval, repeats: true) { _ in
            Task { await handler() }
        }
        if let timer {
            RunLoop.main.add(timer, forMode: .common)
        }
    }

    func stopPolling() {
        timer?.invalidate()
        timer = nil
    }
}
