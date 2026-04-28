#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="/tmp/alfurqan-ios-device-build"
APP_PATH="$BUILD_DIR/Build/Products/Debug-iphoneos/AlFurqan.app"
BUNDLE_ID="com.ahmeddaraz.alfurqan"
WORKSPACE="ios/AlFurqan.xcworkspace"
SCHEME="AlFurqan"
CONFIGURATION="Debug"

IOS_DEVICE_ID="${IOS_DEVICE_ID:-}"
IOS_DEVICE_UDID="${IOS_DEVICE_UDID:-}"
IOS_DEVICE_NAME="${IOS_DEVICE_NAME:-}"

discover_device() {
  if [[ -n "$IOS_DEVICE_ID" && -n "$IOS_DEVICE_UDID" ]]; then
    return
  fi

  local device_json
  device_json="$(mktemp)"

  if ! xcrun devicectl list devices --json-output "$device_json" >/dev/null; then
    rm -f "$device_json"
    echo "Could not read connected iOS devices." >&2
    exit 1
  fi

  local device_vars
  if ! device_vars="$(node - "$device_json" <<'NODE'
const fs = require('fs');
const file = process.argv[2];
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const devices = data.result?.devices ?? [];
const device = devices.find((candidate) =>
  candidate.hardwareProperties?.platform === 'iOS' &&
  candidate.hardwareProperties?.reality === 'physical' &&
  candidate.connectionProperties?.pairingState === 'paired' &&
  candidate.hardwareProperties?.udid &&
  candidate.identifier
);

if (!device) {
  process.exit(2);
}

const name = device.deviceProperties?.name || device.hardwareProperties?.marketingName || 'iPhone';
console.log(`IOS_DEVICE_ID=${JSON.stringify(device.identifier)}`);
console.log(`IOS_DEVICE_UDID=${JSON.stringify(device.hardwareProperties.udid)}`);
console.log(`IOS_DEVICE_NAME=${JSON.stringify(name)}`);
NODE
  )"; then
    rm -f "$device_json"
    echo "No paired physical iPhone was found." >&2
    echo "Connect and unlock the iPhone, tap Trust This Computer if prompted, then run this command again." >&2
    exit 1
  fi

  rm -f "$device_json"

  eval "$device_vars"
  export IOS_DEVICE_ID IOS_DEVICE_UDID IOS_DEVICE_NAME
}

stop_conflicting_builds() {
  pkill -TERM -f "AlFurqan.xcworkspace|alfurqan-ios-device-build|DerivedData/AlFurqan" 2>/dev/null || true
  sleep 1
  pkill -KILL -f "AlFurqan.xcworkspace|alfurqan-ios-device-build|DerivedData/AlFurqan" 2>/dev/null || true
}

clean() {
  stop_conflicting_builds
  rm -rf "$BUILD_DIR" "$HOME"/Library/Developer/Xcode/DerivedData/AlFurqan-*
}

build_app() {
  discover_device
  stop_conflicting_builds

  echo "Building Al Furqan for physical iPhone: $IOS_DEVICE_NAME ($IOS_DEVICE_UDID)"
  cd "$ROOT_DIR"
  xcodebuild -quiet \
    -workspace "$WORKSPACE" \
    -scheme "$SCHEME" \
    -configuration "$CONFIGURATION" \
    -destination "id=$IOS_DEVICE_UDID" \
    -derivedDataPath "$BUILD_DIR" \
    COMPILER_INDEX_STORE_ENABLE=NO \
    build
}

install_app() {
  discover_device

  if [[ ! -d "$APP_PATH" ]]; then
    echo "App bundle not found at $APP_PATH." >&2
    echo "Run npm run phone:build first." >&2
    exit 1
  fi

  echo "Installing Al Furqan on physical iPhone: $IOS_DEVICE_NAME ($IOS_DEVICE_ID)"
  xcrun devicectl device install app --device "$IOS_DEVICE_ID" "$APP_PATH"
}

launch_app() {
  discover_device

  echo "Launching Al Furqan on physical iPhone: $IOS_DEVICE_NAME ($IOS_DEVICE_ID)"
  if ! xcrun devicectl device process launch --device "$IOS_DEVICE_ID" --terminate-existing "$BUNDLE_ID"; then
    echo "The app is installed, but iOS may require trusting this developer before first launch." >&2
    echo "On the iPhone: Settings > General > VPN & Device Management > Apple Development > Trust." >&2
  fi
}

case "${1:-rebuild}" in
  clean)
    clean
    ;;
  build)
    build_app
    ;;
  install)
    install_app
    ;;
  launch)
    launch_app
    ;;
  rebuild)
    clean
    build_app
    install_app
    launch_app
    ;;
  *)
    echo "Usage: $0 {clean|build|install|launch|rebuild}" >&2
    exit 2
    ;;
esac
