import Foundation

final class APIClient {
    private var baseURL: URL
    private var accessToken: String?
    private let session: URLSession

    init(baseURL: URL, session: URLSession? = nil) {
        self.baseURL = baseURL
        if let session {
            self.session = session
        } else {
            let config = URLSessionConfiguration.default
            config.httpShouldSetCookies = true
            config.httpCookieAcceptPolicy = .always
            self.session = URLSession(configuration: config)
        }
    }

    func setBaseURL(_ url: URL) {
        baseURL = url
    }

    func setAccessToken(_ token: String?) {
        accessToken = token
    }

    func signIn(email: String, password: String) async throws -> AuthSession {
        let signInURL = baseURL.appending(path: "api/auth/sign-in/email")
        var request = URLRequest(url: signInURL)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode([
            "email": email,
            "password": password,
        ])

        let (_, response) = try await session.data(for: request)
        try validate(response)

        if let sessionToken = sessionTokenCookieValue(for: baseURL) {
            accessToken = sessionToken
            return AuthSession(accessToken: sessionToken, userEmail: email)
        }

        let cookieHeader = cookieHeaderValue(for: baseURL)
        let token = try await fetchAccessToken(sessionCookieHeader: cookieHeader)
        accessToken = token
        return AuthSession(accessToken: token, userEmail: email)
    }

    func restoreAccessToken(from session: AuthSession) {
        accessToken = session.accessToken
    }

    func fetchMe() async throws -> MeResponse {
        try await get(path: "api/me")
    }

    func fetchManifest(libraryId: String) async throws -> LibraryManifest {
        let response: ManifestResponse = try await get(path: "api/libraries/\(libraryId)/manifest")
        return response.manifest
    }

    func registerDevice(libraryId: String, name: String, platform: String) async throws -> DeviceRecord {
        let response: RegisterDeviceResponse = try await post(
            path: "api/libraries/\(libraryId)/devices",
            body: ["name": name, "platform": platform]
        )
        return response.device
    }

    func updateDevice(
        libraryId: String,
        deviceId: String,
        lastSyncAt: String,
        installedFontIds: [String]
    ) async throws {
        let _: UpdateDeviceResponse = try await patch(
            path: "api/libraries/\(libraryId)/devices/\(deviceId)",
            body: [
                "lastSyncAt": lastSyncAt,
                "installedFontIds": installedFontIds,
            ]
        )
    }

    func downloadFont(libraryId: String, fontId: String) async throws -> Data {
        let url = baseURL.appending(path: "api/libraries/\(libraryId)/fonts/\(fontId)")
        var request = URLRequest(url: url)
        try applyAuth(to: &request)

        let (data, response) = try await session.data(for: request)
        try validate(response, data: data)
        return data
    }

    private struct UpdateDeviceResponse: Decodable {
        let device: DeviceRecord
    }

    private func sessionTokenCookieValue(for url: URL) -> String? {
        session.configuration.httpCookieStorage?
            .cookies(for: url)?
            .first(where: { $0.name == "__Secure-neon-auth.session_token" })?
            .value
    }

    private func cookieHeaderValue(for url: URL) -> String? {
        guard let cookies = session.configuration.httpCookieStorage?.cookies(for: url), !cookies.isEmpty else {
            return nil
        }
        return cookies.map { "\($0.name)=\($0.value)" }.joined(separator: "; ")
    }

    private func fetchAccessToken(sessionCookieHeader: String?) async throws -> String {
        let url = baseURL.appending(path: "api/auth/get-access-token")
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        if let sessionCookieHeader {
            request.setValue(sessionCookieHeader, forHTTPHeaderField: "Cookie")
        }

        let (data, response) = try await session.data(for: request)
        try validate(response, data: data)

        if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] {
            if let token = json["token"] as? String { return token }
            if let token = json["accessToken"] as? String { return token }
            if let dataObj = json["data"] as? [String: Any] {
                if let token = dataObj["token"] as? String { return token }
                if let token = dataObj["accessToken"] as? String { return token }
            }
        }

        if let sessionToken = sessionTokenCookieValue(for: baseURL) {
            return sessionToken
        }

        throw SyncFontError.invalidResponse
    }

    private func get<T: Decodable>(path: String) async throws -> T {
        let url = baseURL.appending(path: path)
        var request = URLRequest(url: url)
        try applyAuth(to: &request)
        let (data, response) = try await session.data(for: request)
        try validate(response, data: data)
        return try JSONDecoder().decode(T.self, from: data)
    }

    private func post<T: Decodable>(path: String, body: [String: Any]) async throws -> T {
        let url = baseURL.appending(path: path)
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        try applyAuth(to: &request)
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        let (data, response) = try await session.data(for: request)
        try validate(response, data: data)
        return try JSONDecoder().decode(T.self, from: data)
    }

    private func patch<T: Decodable>(path: String, body: [String: Any]) async throws -> T {
        let url = baseURL.appending(path: path)
        var request = URLRequest(url: url)
        request.httpMethod = "PATCH"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        try applyAuth(to: &request)
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        let (data, response) = try await session.data(for: request)
        try validate(response, data: data)
        return try JSONDecoder().decode(T.self, from: data)
    }

    private func applyAuth(to request: inout URLRequest) throws {
        guard let accessToken, !accessToken.isEmpty else {
            throw SyncFontError.missingToken
        }
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
    }

    private func validate(_ response: URLResponse, data: Data? = nil) throws {
        guard let http = response as? HTTPURLResponse else {
            throw SyncFontError.invalidResponse
        }

        guard (200 ... 299).contains(http.statusCode) else {
            let message: String
            if
                let data,
                let decoded = try? JSONDecoder().decode(APIErrorResponse.self, from: data),
                let error = decoded.error
            {
                message = error
            } else {
                message = "Request failed with status \(http.statusCode)."
            }
            throw SyncFontError.httpError(status: http.statusCode, message: message)
        }
    }
}
