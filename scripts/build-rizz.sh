#!/bin/sh
# Builds Rizz.app and signs it with the local "Rizz Local Signing" certificate,
# so macOS keeps its Accessibility and Microphone permissions across rebuilds.
# Ad-hoc signing (-s -) gives every build a new identity, which resets them.
set -e
cd "$(dirname "$0")/.."
export PATH="$HOME/.cargo/bin:$PATH" CMAKE_POLICY_VERSION_MINIMUM=3.5

bun run tauri build --bundles app --no-sign \
  -c '{"bundle":{"createUpdaterArtifacts":false}}'

APP=src-tauri/target/release/bundle/macos/Rizz.app
codesign --force --deep --sign "Rizz Local Signing" "$APP"
codesign --verify "$APP"
echo "$APP"
