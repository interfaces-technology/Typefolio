import SwiftUI

#if os(iOS)
@main
struct SyncFontIOSApp: App {
    @StateObject private var syncService = AppBootstrap.makeSyncService()
    @Environment(\.scenePhase) private var scenePhase

    init() {
        IOSSyncScheduler.registerBackgroundTasksIfNeeded()
    }

    var body: some Scene {
        WindowGroup {
            RootView(syncService: syncService)
                .task {
                    await syncService.bootstrap()
                }
                .onChange(of: scenePhase) { _, newPhase in
                    syncService.handleScenePhaseChange(newPhase)
                }
        }
    }
}
#endif
