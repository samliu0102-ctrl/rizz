#!/bin/sh
# Builds Rizz.app and signs it with the local "Rizz Local Signing" certificate,
# so macOS keeps its Accessibility and Microphone permissions across rebuilds.
# Ad-hoc signing (-s -) gives every build a new identity, which resets them.
set -e
cd "$(dirname "$0")/.."
export PATH="$HOME/.cargo/bin:$PATH" CMAKE_POLICY_VERSION_MINIMUM=3.5
# Keep the builder's home folder (and so their username) out of the binary.
export RUSTFLAGS="--remap-path-prefix=$HOME=/build"
export CFLAGS="-ffile-prefix-map=$HOME=/build" CXXFLAGS="-ffile-prefix-map=$HOME=/build"

bun run tauri build --bundles app --no-sign \
  -c '{"bundle":{"createUpdaterArtifacts":false}}'

APP=src-tauri/target/release/bundle/macos/Rizz.app
codesign --force --deep --sign "Rizz Local Signing" "$APP"
codesign --verify "$APP"
echo "$APP"
