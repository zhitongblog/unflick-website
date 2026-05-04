#!/usr/bin/env bash
# unflick.app/install.sh — one-line install for macOS + Linux.
#
# usage:  curl -fsSL https://unflick.app/install.sh | bash
#
# macOS: downloads the signed + notarized universal .dmg, copies the .app
# into /Applications, strips the quarantine bit so first launch doesn't hit
# Gatekeeper. Requires Homebrew-installed libmpv at runtime: see Prereq.
#
# Linux: downloads the AppImage, makes it executable, drops it into
# ~/.local/bin/unflick. Requires libmpv2 + libwebkit2gtk-4.1-0 from your
# distro's package manager.
#
# Source code: https://github.com/zhitongblog/unflick

set -euo pipefail

REPO="zhitongblog/unflick"
SITE="https://unflick.app"

color_red()   { printf '\033[31m%s\033[0m' "$1"; }
color_green() { printf '\033[32m%s\033[0m' "$1"; }
color_dim()   { printf '\033[2m%s\033[0m' "$1"; }

err() { echo "$(color_red "error:") $*" >&2; exit 1; }
say() { echo "$(color_green "==>") $*"; }

command -v curl >/dev/null 2>&1 || err "curl is required but not on PATH."

# Resolve the latest tag through the site's edge endpoint rather than hitting
# api.github.com directly. The Pages Function caches at the edge so we don't
# burn the visitor's anonymous rate limit (60/hr/IP), which can already be
# exhausted on shared NAT / corporate networks.
say "Resolving latest version..."
TAG=$(curl -fsSL "$SITE/api/stats" | sed -nE 's/.*"latest_tag":"?([^",}]+)".*/\1/p' | head -1)
if [ -z "${TAG:-}" ] || [ "$TAG" = "null" ]; then
  err "could not resolve latest tag from $SITE/api/stats — try again, or grab the file manually from https://github.com/$REPO/releases"
fi
TAG_BARE=${TAG#v}
echo "    latest = $TAG"

OS=$(uname -s)
ARCH=$(uname -m)

case "$OS" in
  Darwin)
    URL="https://github.com/$REPO/releases/download/$TAG/unflick_${TAG_BARE}_universal.dmg"
    TMP=$(mktemp -d)
    DMG="$TMP/unflick.dmg"
    say "Downloading universal DMG..."
    echo "    $URL"
    curl -fL --progress-bar -o "$DMG" "$URL" || err "download failed"

    say "Mounting..."
    MOUNT=$(hdiutil attach -nobrowse "$DMG" | awk -F'\t' '/\/Volumes\// {print $NF; exit}')
    [ -d "$MOUNT/unflick.app" ] || { hdiutil detach "$MOUNT" -quiet 2>/dev/null || true; err "DMG didn't contain unflick.app"; }

    say "Installing /Applications/unflick.app (requires admin if /Applications isn't user-writable)..."
    if [ -w /Applications ]; then
      rm -rf /Applications/unflick.app
      cp -R "$MOUNT/unflick.app" /Applications/
    else
      sudo rm -rf /Applications/unflick.app
      sudo cp -R "$MOUNT/unflick.app" /Applications/
    fi
    xattr -dr com.apple.quarantine /Applications/unflick.app 2>/dev/null || true

    hdiutil detach "$MOUNT" -quiet
    rm -rf "$TMP"

    if ! command -v mpv >/dev/null 2>&1 && ! [ -e /opt/homebrew/lib/libmpv*.dylib ] && ! [ -e /usr/local/lib/libmpv*.dylib ]; then
      echo
      echo "$(color_dim "Prereq:") unflick loads libmpv at runtime. Install it with:"
      echo "  brew install mpv"
    fi

    echo
    say "Installed. Launch:"
    echo "  open -a unflick"
    ;;

  Linux)
    if [ "$ARCH" != "x86_64" ] && [ "$ARCH" != "amd64" ]; then
      err "only x86_64 Linux builds are published right now (got: $ARCH)"
    fi
    URL="https://github.com/$REPO/releases/download/$TAG/unflick_${TAG_BARE}_amd64.AppImage"
    DEST="${UNFLICK_INSTALL_DIR:-$HOME/.local/bin}"
    mkdir -p "$DEST"
    BIN="$DEST/unflick"

    say "Downloading AppImage..."
    echo "    $URL"
    curl -fL --progress-bar -o "$BIN" "$URL" || err "download failed"
    chmod +x "$BIN"

    if ! ldconfig -p 2>/dev/null | grep -q libmpv; then
      echo
      echo "$(color_dim "Prereq:") unflick loads libmpv at runtime. Install it with:"
      if command -v apt >/dev/null 2>&1;     then echo "  sudo apt install libmpv2 libwebkit2gtk-4.1-0"
      elif command -v dnf >/dev/null 2>&1;   then echo "  sudo dnf install mpv-libs webkit2gtk4.1"
      elif command -v pacman >/dev/null 2>&1;then echo "  sudo pacman -S mpv webkit2gtk-4.1"
      else                                        echo "  install libmpv2 + webkit2gtk-4.1 from your distro repo"
      fi
    fi

    echo
    say "Installed at $BIN"
    case ":$PATH:" in
      *":$DEST:"*) echo "  Run with: unflick" ;;
      *)
        echo "  Note: $DEST is not on PATH. Either add it to your shell rc:"
        echo "    export PATH=\"$DEST:\$PATH\""
        echo "  or run with the full path:"
        echo "    $BIN"
        ;;
    esac
    ;;

  *)
    err "unsupported OS: $OS — open https://github.com/$REPO/releases for manual download"
    ;;
esac
