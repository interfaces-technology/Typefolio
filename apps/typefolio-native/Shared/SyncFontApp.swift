import SwiftUI

struct RootView: View {
    @ObservedObject var syncService: SyncService

    var body: some View {
        Group {
            if syncService.state.isSignedIn {
                StatusView(syncService: syncService)
            } else {
                LoginView(syncService: syncService)
            }
        }
        .frame(minWidth: 420, minHeight: 480)
    }
}

enum PlatformServices {
    static var fontInstaller: FontInstalling {
        #if os(macOS)
        return MacFontInstaller()
        #else
        return IOSFontInstaller()
        #endif
    }

    static var scheduler: SyncScheduling {
        #if os(macOS)
        return MacSyncScheduler()
        #else
        return IOSSyncScheduler()
        #endif
    }
}

@MainActor
enum AppBootstrap {
    static func makeSyncService() -> SyncService {
        SyncService(
            fontInstaller: PlatformServices.fontInstaller,
            scheduler: PlatformServices.scheduler
        )
    }
}
