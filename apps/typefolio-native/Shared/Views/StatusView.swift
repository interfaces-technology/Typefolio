import SwiftUI

struct StatusView: View {
    @ObservedObject var syncService: SyncService

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 8) {
                    Text(syncService.state.libraryName.isEmpty ? "Your fonts" : syncService.state.libraryName)
                        .font(.title2.bold())
                    Text("Signed in as \(syncService.state.userEmail)")
                        .foregroundStyle(.secondary)
                }

                if let message = syncService.state.comingSoonMessage {
                    Text(message)
                        .padding(12)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(.quaternary.opacity(0.4), in: RoundedRectangle(cornerRadius: 12))
                }

                Grid(alignment: .leading, horizontalSpacing: 24, verticalSpacing: 10) {
                    GridRow {
                        Text("Installed fonts")
                        Text("\(syncService.state.installedCount)")
                            .fontWeight(.semibold)
                    }
                    GridRow {
                        Text("Last sync")
                        Text(lastSyncLabel)
                            .fontWeight(.semibold)
                    }
                }

                HStack(spacing: 12) {
                    Button(syncService.state.isSyncing ? "Syncing…" : "Sync now") {
                        Task { await syncService.syncNow() }
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(!syncService.state.supportsSync || syncService.state.isSyncing)

                    Button("Sign out") {
                        syncService.signOut()
                    }
                    .buttonStyle(.bordered)
                }

                ActivityLogView(entries: syncService.activity)
            }
            .padding(24)
            .frame(maxWidth: 640, alignment: .leading)
        }
    }

    private var lastSyncLabel: String {
        guard let lastSyncAt = syncService.state.lastSyncAt else {
            return "Never"
        }
        return lastSyncAt.formatted(date: .abbreviated, time: .shortened)
    }
}

struct ActivityLogView: View {
    let entries: [SyncActivity]

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Activity")
                .font(.headline)

            if entries.isEmpty {
                Text("No activity yet.")
                    .foregroundStyle(.secondary)
            } else {
                ForEach(entries) { entry in
                    HStack(alignment: .top, spacing: 8) {
                        Circle()
                            .fill(color(for: entry.level))
                            .frame(width: 8, height: 8)
                            .padding(.top, 5)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(entry.message)
                            Text(entry.timestamp.formatted(date: .omitted, time: .standard))
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
        }
    }

    private func color(for level: ActivityLevel) -> Color {
        switch level {
        case .info:
            return .secondary
        case .success:
            return .green
        case .warning:
            return .orange
        case .error:
            return .red
        }
    }
}
