#if os(iOS)
import AuthenticationServices
import Foundation
import UIKit

enum IOSBrowserAuthError: LocalizedError {
    case cancelled
    case invalidCallback
    case missingToken

    var errorDescription: String? {
        switch self {
        case .cancelled:
            return "Sign-in was cancelled."
        case .invalidCallback:
            return "The browser returned an invalid sign-in response."
        case .missingToken:
            return "Sign-in did not return a session token."
        }
    }
}

@MainActor
final class IOSBrowserAuthService: NSObject, ASWebAuthenticationPresentationContextProviding {
    private static let callbackScheme = "syncfont"
    private static let redirectURI = "syncfont://auth/callback"

    func signIn(apiBaseURL: URL) async throws -> AuthSession {
        var components = URLComponents(
            url: apiBaseURL.appending(path: "auth/desktop"),
            resolvingAgainstBaseURL: false
        )
        components?.queryItems = [
            URLQueryItem(name: "redirect_uri", value: Self.redirectURI),
        ]

        guard let authURL = components?.url else {
            throw SyncFontError.invalidResponse
        }

        return try await withCheckedThrowingContinuation { continuation in
            let session = ASWebAuthenticationSession(
                url: authURL,
                callbackURLScheme: Self.callbackScheme
            ) { callbackURL, error in
                if let error {
                    let nsError = error as NSError
                    if nsError.domain == ASWebAuthenticationSessionErrorDomain,
                       nsError.code == ASWebAuthenticationSessionError.canceledLogin.rawValue {
                        continuation.resume(throwing: IOSBrowserAuthError.cancelled)
                    } else {
                        continuation.resume(throwing: error)
                    }
                    return
                }

                guard let callbackURL else {
                    continuation.resume(throwing: IOSBrowserAuthError.invalidCallback)
                    return
                }

                do {
                    continuation.resume(returning: try Self.parseSession(from: callbackURL))
                } catch {
                    continuation.resume(throwing: error)
                }
            }

            session.presentationContextProvider = self
            session.prefersEphemeralWebBrowserSession = false

            if !session.start() {
                continuation.resume(throwing: SyncFontError.invalidResponse)
            }
        }
    }

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        if let window = scenes.flatMap(\.windows).first(where: \.isKeyWindow) {
            return window
        }
        if let window = scenes.flatMap(\.windows).first {
            return window
        }
        return ASPresentationAnchor()
    }

    private static func parseSession(from url: URL) throws -> AuthSession {
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
            throw IOSBrowserAuthError.invalidCallback
        }

        let token = components.queryItems?.first(where: { $0.name == "token" })?.value
        let email = components.queryItems?.first(where: { $0.name == "email" })?.value

        guard let token, !token.isEmpty else {
            throw IOSBrowserAuthError.missingToken
        }

        return AuthSession(
            accessToken: token,
            userEmail: email ?? "Signed in"
        )
    }
}
#endif
