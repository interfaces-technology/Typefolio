import SwiftUI

#if os(iOS)
@main
struct SyncFontIOSApp: App {
    @StateObject private var syncService = AppBootstrap.makeSyncService()

    var body: some Scene {
        WindowGroup {
            RootView(syncService: syncService)
                .task {
                    await syncService.bootstrap()
                }
        }
    }
}
#endif
