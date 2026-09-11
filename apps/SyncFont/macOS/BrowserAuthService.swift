#if os(macOS)
import AppKit
import Foundation
import Network

enum BrowserAuthError: LocalizedError {
    case callbackTimeout
    case invalidCallback
    case missingToken

    var errorDescription: String? {
        switch self {
        case .callbackTimeout:
            return "Sign-in timed out. Try again."
        case .invalidCallback:
            return "The browser returned an invalid sign-in response."
        case .missingToken:
            return "Sign-in did not return a session token."
        }
    }
}

final class BrowserAuthService {
    func signIn(apiBaseURL: URL) async throws -> AuthSession {
        let server = LocalCallbackServer()
        let port = try server.start()

        let redirectURI = "http://127.0.0.1:\(port)/callback"
        var components = URLComponents(
            url: apiBaseURL.appending(path: "auth/desktop"),
            resolvingAgainstBaseURL: false
        )
        components?.queryItems = [
            URLQueryItem(name: "redirect_uri", value: redirectURI),
        ]

        guard let authURL = components?.url else {
            server.stop()
            throw SyncFontError.invalidResponse
        }

        NSWorkspace.shared.open(authURL)

        defer { server.stop() }

        return try await withThrowingTaskGroup(of: AuthSession.self) { group in
            group.addTask {
                try await server.waitForCallback()
            }
            group.addTask {
                try await Task.sleep(nanoseconds: 5 * 60 * 1_000_000_000)
                throw BrowserAuthError.callbackTimeout
            }

            guard let session = try await group.next() else {
                throw BrowserAuthError.callbackTimeout
            }
            group.cancelAll()
            return session
        }
    }
}

private final class LocalCallbackServer: @unchecked Sendable {
    private var listener: NWListener?
    private var continuation: CheckedContinuation<AuthSession, Error>?
    private let queue = DispatchQueue(label: "com.syncfont.auth-callback")

    func start() throws -> UInt16 {
        let listener = try NWListener(using: .tcp, on: .any)
        self.listener = listener

        var assignedPort: UInt16?

        listener.stateUpdateHandler = { [weak self] state in
            switch state {
            case .ready:
                assignedPort = listener.port?.rawValue
            case .failed(let error):
                self?.resumeFailure(error)
            default:
                break
            }
        }

        listener.newConnectionHandler = { [weak self] connection in
            self?.handle(connection: connection)
        }

        listener.start(queue: queue)

        let deadline = Date().addingTimeInterval(2)
        while assignedPort == nil && Date() < deadline {
            Thread.sleep(forTimeInterval: 0.05)
        }

        guard let port = assignedPort else {
            throw SyncFontError.invalidResponse
        }

        return port
    }

    func waitForCallback() async throws -> AuthSession {
        try await withCheckedThrowingContinuation { continuation in
            queue.async {
                self.continuation = continuation
            }
        }
    }

    func stop() {
        listener?.cancel()
        listener = nil
        resumeFailure(CancellationError())
    }

    private func handle(connection: NWConnection) {
        connection.start(queue: queue)
        connection.receive(minimumIncompleteLength: 1, maximumLength: 64 * 1024) { [weak self] data, _, _, _ in
            guard let self, let data, let request = String(data: data, encoding: .utf8) else {
                connection.cancel()
                return
            }

            let responseBody = "<html><body><p>Signed in. You can close this tab and return to syncFont.</p></body></html>"
            let response = """
            HTTP/1.1 200 OK\r
            Content-Type: text/html; charset=utf-8\r
            Content-Length: \(responseBody.utf8.count)\r
            Connection: close\r
            \r
            \(responseBody)
            """

            if let session = self.parseSession(from: request) {
                connection.send(content: response.data(using: .utf8), completion: .contentProcessed { _ in
                    connection.cancel()
                    self.resumeSuccess(session)
                })
            } else {
                connection.send(content: response.data(using: .utf8), completion: .contentProcessed { _ in
                    connection.cancel()
                    self.resumeFailure(BrowserAuthError.invalidCallback)
                })
            }
        }
    }

    private func parseSession(from request: String) -> AuthSession? {
        guard let requestLine = request.split(separator: "\r\n").first else {
            return nil
        }

        let parts = requestLine.split(separator: " ")
        guard parts.count >= 2 else {
            return nil
        }

        let path = String(parts[1])
        guard let components = URLComponents(string: path) else {
            return nil
        }

        let token = components.queryItems?.first(where: { $0.name == "token" })?.value
        let email = components.queryItems?.first(where: { $0.name == "email" })?.value

        guard let token, !token.isEmpty else {
            return nil
        }

        return AuthSession(
            accessToken: token,
            userEmail: email ?? "Signed in"
        )
    }

    private func resumeSuccess(_ session: AuthSession) {
        queue.async {
            guard let continuation = self.continuation else { return }
            self.continuation = nil
            continuation.resume(returning: session)
        }
    }

    private func resumeFailure(_ error: Error) {
        queue.async {
            guard let continuation = self.continuation else { return }
            self.continuation = nil
            continuation.resume(throwing: error)
        }
    }
}
#endif
