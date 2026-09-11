import SwiftUI

struct LoginView: View {
    @ObservedObject var syncService: SyncService

    @State private var isSubmitting = false
    @State private var errorMessage: String?
    @State private var showError = false
    #if os(iOS)
    @State private var showEmailSignIn = false
    @State private var apiBaseURL = "http://127.0.0.1:43123"
    @State private var email = ""
    @State private var password = ""
    #endif

    var body: some View {
        VStack(spacing: 20) {
            VStack(spacing: 8) {
                Text("syncFont")
                    .font(.largeTitle.bold())
                Text("Sign in to sync your fonts.")
                    .foregroundStyle(.secondary)
            }

            Button(isSubmitting ? "Opening browser…" : "Sign in with browser") {
                Task { await submitBrowserSignIn() }
            }
            .buttonStyle(.borderedProminent)
            .disabled(isSubmitting)

            #if os(iOS)
            DisclosureGroup("Sign in with email", isExpanded: $showEmailSignIn) {
                VStack(alignment: .leading, spacing: 12) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("API URL")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        TextField("http://127.0.0.1:43123", text: $apiBaseURL)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .textFieldStyle(.roundedBorder)
                    }

                    VStack(alignment: .leading, spacing: 4) {
                        Text("Email")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        TextField("you@studio.com", text: $email)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .keyboardType(.emailAddress)
                            .textFieldStyle(.roundedBorder)
                    }

                    VStack(alignment: .leading, spacing: 4) {
                        Text("Password")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        SecureField("Password", text: $password)
                            .textFieldStyle(.roundedBorder)
                    }

                    Button(isSubmitting ? "Signing in…" : "Sign in") {
                        Task { await submitEmailSignIn() }
                    }
                    .buttonStyle(.bordered)
                    .disabled(isSubmitting || email.isEmpty || password.isEmpty)
                }
                .padding(.top, 8)
            }
            #endif
        }
        .padding(24)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .alert("Sign in failed", isPresented: $showError) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(errorMessage ?? "Something went wrong.")
        }
    }

    private func submitBrowserSignIn() async {
        isSubmitting = true
        defer { isSubmitting = false }

        do {
            #if os(iOS)
            try await syncService.signInWithBrowser(apiBaseURLString: apiBaseURL)
            #else
            try await syncService.signInWithBrowser()
            #endif
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
    }

    #if os(iOS)
    private func submitEmailSignIn() async {
        isSubmitting = true
        defer { isSubmitting = false }

        do {
            try await syncService.signIn(
                email: email,
                password: password,
                apiBaseURLString: apiBaseURL
            )
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
    }
    #endif
}
