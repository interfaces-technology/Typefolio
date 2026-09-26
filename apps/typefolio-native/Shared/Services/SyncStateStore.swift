import Foundation

struct PersistedSyncState: Codable, Equatable {
    var installedFontIds: [String]
    var lastEtag: String?
    var deviceId: String?
}

final class SyncStateStore {
    private let defaults = UserDefaults.standard
    private let keyPrefix = "syncState."

    func load(libraryId: String) -> PersistedSyncState? {
        guard let data = defaults.data(forKey: storageKey(libraryId: libraryId)) else {
            return nil
        }
        return try? JSONDecoder().decode(PersistedSyncState.self, from: data)
    }

    func save(libraryId: String, state: PersistedSyncState) {
        guard let data = try? JSONEncoder().encode(state) else {
            return
        }
        defaults.set(data, forKey: storageKey(libraryId: libraryId))
    }

    func clear(libraryId: String) {
        defaults.removeObject(forKey: storageKey(libraryId: libraryId))
    }

    private func storageKey(libraryId: String) -> String {
        "\(keyPrefix)\(libraryId)"
    }
}
