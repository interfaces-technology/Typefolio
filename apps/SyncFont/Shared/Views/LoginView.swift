import SwiftUI

struct LoginView: View {
    @ObservedObject var syncService: SyncService

    @State private var isSubmitting = false
    @State private var errorMessage: String?
    @State private var showError = false

    var body: some View {
        #if os(macOS)
        Button(isSubmitting ? "Opening browser…" : "Sign in with browser") {
            Task { await submitBrowserSignIn() }
        }
        .buttonStyle(.borderedProminent)
        .disabled(isSubmitting)
        .alert("Sign in failed", isPresented: $showError) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(errorMessage ?? "Something went wrong.")
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        #else
        Text("Browser sign-in on iPad is coming soon.")
            .foregroundStyle(.secondary)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        #endif
    }

    #if os(macOS)
    private func submitBrowserSignIn() async {
        isSubmitting = true
        defer { isSubmitting = false }

        do {
            try await syncService.signInWithBrowser()
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
    }
    #endif
}
