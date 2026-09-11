import Foundation

enum SyncFontError: LocalizedError {
    case invalidResponse
    case httpError(status: Int, message: String)
    case missingToken
    case unsupportedPlatform

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "The server returned an unexpected response."
        case .httpError(_, let message):
            return message
        case .missingToken:
            return "Sign in is required."
        case .unsupportedPlatform:
            return "This action is not supported on this device yet."
        }
    }
}

struct AuthSession: Codable {
    let accessToken: String
    let userEmail: String
}

struct MeResponse: Codable {
    let user: MeUser
    let library: MeLibrary
}

struct MeUser: Codable {
    let id: String
}

struct MeLibrary: Codable {
    let id: String
    let name: String
    let description: String?
    let fontCount: Int
    let createdAt: String
    let updatedAt: String
}

struct LibraryManifest: Codable {
    let libraryId: String
    let updatedAt: String
    let etag: String
    let fonts: [FontManifestEntry]
}

struct FontManifestEntry: Codable, Identifiable {
    let id: String
    let originalName: String
    let sha256: String
    let size: Int
    let fileExtension: String
    let uploadedAt: String

    enum CodingKeys: String, CodingKey {
        case id
        case originalName
        case sha256
        case size
        case fileExtension = "extension"
        case uploadedAt
    }
}

struct DeviceRecord: Codable {
    let id: String
    let name: String
    let platform: String
}

struct RegisterDeviceResponse: Codable {
    let device: DeviceRecord
}

struct ManifestResponse: Codable {
    let manifest: LibraryManifest
}

struct APIErrorResponse: Codable {
    let error: String?
}

struct SyncActivity: Identifiable, Codable {
    let id: UUID
    let timestamp: Date
    let message: String
    let level: ActivityLevel

    init(message: String, level: ActivityLevel = .info) {
        self.id = UUID()
        self.timestamp = Date()
        self.message = message
        self.level = level
    }
}

enum ActivityLevel: String, Codable {
    case info
    case success
    case warning
    case error
}

struct SyncState: Equatable {
    var isSignedIn: Bool = false
    var userEmail: String = ""
    var libraryId: String = ""
    var libraryName: String = ""
    var installedCount: Int = 0
    var lastSyncAt: Date?
    var lastEtag: String?
    var deviceId: String?
    var isSyncing: Bool = false
    var supportsSync: Bool = PlatformCapabilities.supportsBackgroundSync
    var comingSoonMessage: String? = PlatformCapabilities.comingSoonMessage
}

enum PlatformCapabilities {
    static var supportsBackgroundSync: Bool {
        #if os(macOS)
        return true
        #else
        return false
        #endif
    }

    static var comingSoonMessage: String? {
        #if os(iOS)
        return "Font sync on iPad is coming soon. Your fonts are available on Mac and web."
        #else
        return nil
        #endif
    }

    static var devicePlatform: String {
        #if os(macOS)
        return "macos"
        #elseif os(iOS)
        return "ios"
        #else
        return "macos"
        #endif
    }
}
