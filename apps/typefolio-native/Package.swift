// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "TypefolioNative",
    platforms: [
        .macOS(.v14),
        .iOS(.v17),
    ],
    products: [
        .executable(name: "Typefolio", targets: ["TypefolioApp"]),
    ],
    targets: [
        .executableTarget(
            name: "TypefolioApp",
            path: ".",
            exclude: [
                "README.md",
                "Typefolio.xcodeproj",
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
