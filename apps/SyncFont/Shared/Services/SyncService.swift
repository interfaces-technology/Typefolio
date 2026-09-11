import Foundation

@MainActor
final class SyncService: ObservableObject {
    @Published private(set) var state = SyncState()
    @Published private(set) var activity: [SyncActivity] = []

    private let keychain = KeychainStore()
    private let apiClient: APIClient
    private let fontInstaller: FontInstalling
    private let scheduler: SyncScheduling
    private var installedFontIds: [String] = []
    private var apiBaseURL: URL

    init(
        apiBaseURL: URL = URL(string: "http://127.0.0.1:43123")!,
        fontInstaller: FontInstalling,
        scheduler: SyncScheduling
    ) {
        self.apiBaseURL = apiBaseURL
        self.apiClient = APIClient(baseURL: apiBaseURL)
        self.fontInstaller = fontInstaller
        self.scheduler = scheduler
    }

    func bootstrap() async {
        do {
            if let (session, savedURL) = try keychain.loadSession() {
                apiBaseURL = savedURL
                apiClient.setBaseURL(savedURL)
                apiClient.restoreAccessToken(from: session)
                let me = try await apiClient.fetchMe()
                state.isSignedIn = true
                state.userEmail = session.userEmail
                state.libraryId = me.library.id
                state.libraryName = me.library.name
                appendActivity("Restored session for \(session.userEmail).", level: .info)

                if PlatformCapabilities.supportsBackgroundSync {
                    try await ensureDeviceRegistered()
                    scheduler.startPolling(interval: 30) { [weak self] in
                        await self?.syncNow()
                    }
                    await syncNow()
                }
            }
        } catch {
            appendActivity(error.localizedDescription, level: .warning)
        }
    }

    func signInWithBrowser() async throws {
        try await signInWithBrowser(apiBaseURLString: apiBaseURL.absoluteString)
    }

    func signInWithBrowser(apiBaseURLString: String) async throws {
        #if os(macOS)
        guard let url = URL(string: apiBaseURLString.trimmingCharacters(in: .whitespacesAndNewlines)) else {
            throw SyncFontError.httpError(status: 400, message: "Enter a valid API URL.")
        }

        apiBaseURL = url
        apiClient.setBaseURL(url)

        let session = try await BrowserAuthService().signIn(apiBaseURL: url)
        try await completeSignIn(session: session, apiBaseURL: url)
        #else
        throw SyncFontError.unsupportedPlatform
        #endif
    }

    func signIn(email: String, password: String, apiBaseURLString: String) async throws {
        guard let url = URL(string: apiBaseURLString.trimmingCharacters(in: .whitespacesAndNewlines)) else {
            throw SyncFontError.httpError(status: 400, message: "Enter a valid API URL.")
        }

        apiBaseURL = url
        apiClient.setBaseURL(url)
        let session = try await apiClient.signIn(email: email, password: password)
        try await completeSignIn(session: session, apiBaseURL: url)
    }

    private func completeSignIn(session: AuthSession, apiBaseURL url: URL) async throws {
        apiClient.restoreAccessToken(from: session)
        try keychain.saveSession(session, apiBaseURL: url)

        let me = try await apiClient.fetchMe()
        state = SyncState(
            isSignedIn: true,
            userEmail: session.userEmail,
            libraryId: me.library.id,
            libraryName: me.library.name,
            installedCount: installedFontIds.count,
            supportsSync: PlatformCapabilities.supportsBackgroundSync,
            comingSoonMessage: PlatformCapabilities.comingSoonMessage
        )

        appendActivity("Signed in as \(session.userEmail).", level: .success)

        if PlatformCapabilities.supportsBackgroundSync {
            try await ensureDeviceRegistered()
            scheduler.startPolling(interval: 30) { [weak self] in
                await self?.syncNow()
            }
            await syncNow()
        } else {
            appendActivity(
                PlatformCapabilities.comingSoonMessage ?? "Sync is not available on this device yet.",
                level: .info
            )
        }
    }

    func signOut() {
        scheduler.stopPolling()
        installedFontIds = []
        state = SyncState(
            supportsSync: PlatformCapabilities.supportsBackgroundSync,
            comingSoonMessage: PlatformCapabilities.comingSoonMessage
        )
        activity = []
        try? keychain.clearSession()
        apiClient.setAccessToken(nil)
    }

    func syncNow() async {
        guard PlatformCapabilities.supportsBackgroundSync else {
            appendActivity(
                PlatformCapabilities.comingSoonMessage ?? "Sync is not available on this device yet.",
                level: .info
            )
            return
        }

        guard state.isSignedIn, !state.libraryId.isEmpty else {
            return
        }

        state.isSyncing = true
        defer { state.isSyncing = false }

        do {
            if state.deviceId == nil {
                try await ensureDeviceRegistered()
            }

            let manifest = try await apiClient.fetchManifest(libraryId: state.libraryId)
            if manifest.etag == state.lastEtag {
                appendActivity("Already up to date.", level: .info)
                return
            }

            var installedThisRun = 0
            for font in manifest.fonts {
                if installedFontIds.contains(font.id) {
                    continue
                }

                let data = try await apiClient.downloadFont(
                    libraryId: state.libraryId,
                    fontId: font.id
                )
                _ = try await fontInstaller.installFont(
                    data: data,
                    filename: font.originalName,
                    expectedSHA256: font.sha256
                )
                installedFontIds.append(font.id)
                installedThisRun += 1
                appendActivity("Installed \(font.originalName).", level: .success)
            }

            state.lastEtag = manifest.etag
            state.lastSyncAt = Date()
            state.installedCount = installedFontIds.count

            if let deviceId = state.deviceId {
                let iso = ISO8601DateFormatter().string(from: Date())
                try await apiClient.updateDevice(
                    libraryId: state.libraryId,
                    deviceId: deviceId,
                    lastSyncAt: iso,
                    installedFontIds: installedFontIds
                )
            }

            if installedThisRun == 0 {
                appendActivity("Manifest updated. No new fonts to install.", level: .info)
            }
        } catch {
            appendActivity(error.localizedDescription, level: .error)
        }
    }

    private func ensureDeviceRegistered() async throws {
        let deviceName = Host.current().localizedName ?? "Mac"
        let device = try await apiClient.registerDevice(
            libraryId: state.libraryId,
            name: deviceName,
            platform: PlatformCapabilities.devicePlatform
        )
        state.deviceId = device.id
    }

    private func appendActivity(_ message: String, level: ActivityLevel) {
        activity.insert(SyncActivity(message: message, level: level), at: 0)
        if activity.count > 50 {
            activity.removeLast(activity.count - 50)
        }
    }
}
