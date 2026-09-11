import Foundation

final class IOSFontInstaller: FontInstalling {
    func installFont(data: Data, filename: String, expectedSHA256: String) async throws -> URL {
        throw SyncFontError.unsupportedPlatform
    }
}

final class IOSSyncScheduler: SyncScheduling {
    func startPolling(interval: TimeInterval, handler: @escaping () async -> Void) {
        // Background sync on iPad is deferred to a later release.
    }

    func stopPolling() {
        // No-op for the iPad scaffold.
    }
}
