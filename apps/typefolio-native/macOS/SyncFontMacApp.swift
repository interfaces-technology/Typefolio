import SwiftUI

#if os(macOS)
@main
struct SyncFontMacApp: App {
    @StateObject private var syncService = AppBootstrap.makeSyncService()

    var body: some Scene {
        WindowGroup {
            RootView(syncService: syncService)
                .task {
                    await syncService.bootstrap()
                }
        }
        .defaultSize(width: 720, height: 640)
    }
}
#endif
