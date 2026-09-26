import Foundation
import Security

final class KeychainStore {
    private let service = "com.syncfont.app"

    func saveSession(_ session: AuthSession, apiBaseURL: URL) throws {
        let payload = StoredCredentials(
            accessToken: session.accessToken,
            userEmail: session.userEmail,
            apiBaseURL: apiBaseURL.absoluteString
        )
        let data = try JSONEncoder().encode(payload)
        try save(key: "session", data: data)
    }

    func loadSession() throws -> (AuthSession, URL)? {
        guard let data = try load(key: "session") else {
            return nil
        }

        let payload = try JSONDecoder().decode(StoredCredentials.self, from: data)
        guard let url = URL(string: payload.apiBaseURL) else {
            return nil
        }

        return (
            AuthSession(accessToken: payload.accessToken, userEmail: payload.userEmail),
            url
        )
    }

    func clearSession() throws {
        try delete(key: "session")
    }

    private struct StoredCredentials: Codable {
        let accessToken: String
        let userEmail: String
        let apiBaseURL: String
    }

    private func save(key: String, data: Data) throws {
        try delete(key: key)

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
        ]

        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw SyncFontError.invalidResponse
        }
    }

    private func load(key: String) throws -> Data? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]

        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        if status == errSecItemNotFound {
            return nil
        }
        guard status == errSecSuccess, let data = item as? Data else {
            throw SyncFontError.invalidResponse
        }
        return data
    }

    private func delete(key: String) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
        ]
        SecItemDelete(query as CFDictionary)
    }
}
