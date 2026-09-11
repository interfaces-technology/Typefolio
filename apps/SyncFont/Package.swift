// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "SyncFont",
    platforms: [
        .macOS(.v14),
        .iOS(.v17),
    ],
    products: [
        .executable(name: "SyncFont", targets: ["SyncFontApp"]),
    ],
    targets: [
        .executableTarget(
            name: "SyncFontApp",
            path: ".",
            exclude: [
                "README.md",
                "SyncFont.xcodeproj",
                "iOS/Info.plist",
                "scripts",
            ],
            sources: [
                "Shared",
                "macOS",
                "iOS",
            ]
        ),
    ]
)
