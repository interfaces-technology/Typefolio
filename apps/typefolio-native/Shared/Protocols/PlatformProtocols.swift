import CommonCrypto
import Foundation

protocol FontInstalling {
    func installFont(data: Data, filename: String, expectedSHA256: String) async throws -> URL
}

protocol SyncScheduling: AnyObject {
    func startPolling(interval: TimeInterval, handler: @escaping () async -> Void)
    func stopPolling()
}

enum FontInstallError: LocalizedError, Equatable {
    case hashMismatch
    case invalidFilename
    case unsupportedFontFormat

    var errorDescription: String? {
        switch self {
        case .hashMismatch:
            return "Downloaded font failed integrity verification."
        case .invalidFilename:
            return "The font filename is invalid."
        case .unsupportedFontFormat:
            return "This font format is not supported on iPad. Use .ttf or .otf."
        }
    }
}

func sha256Hex(of data: Data) -> String {
    var hash = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
    data.withUnsafeBytes { buffer in
        _ = CC_SHA256(buffer.baseAddress, CC_LONG(buffer.count), &hash)
    }
    return hash.map { String(format: "%02x", $0) }.joined()
}

func sanitizeFilename(_ filename: String) -> String {
    filename
        .components(separatedBy: CharacterSet(charactersIn: "/\\:"))
        .joined()
        .trimmingCharacters(in: .whitespacesAndNewlines)
}
