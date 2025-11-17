#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./scripts/install-meslo-host-fonts.sh
# This script downloads the Meslo Nerd Font and installs it for the current user.
# It supports Linux (XDG), macOS. For Windows, it prints manual steps.

DEST_LINUX="$HOME/.local/share/fonts/meslo-nerd-font"
DEST_MAC="$HOME/Library/Fonts"

download_and_install_linux() {
  mkdir -p "$DEST_LINUX"
  URL="https://github.com/ryanoasis/nerd-fonts/releases/latest/download/Meslo.zip"
  TF="/tmp/Meslo.zip"
  echo "Downloading Meslo Nerd Font from $URL"
  curl -fsSL "$URL" -o "$TF"
  echo ".. extracting to $DEST_LINUX"
  unzip -o "$TF" -d "$DEST_LINUX" >/dev/null
  rm -f "$TF"
  echo "Refreshing font cache"
  if command -v fc-cache >/dev/null 2>&1; then
    fc-cache -f -v || true
  fi
  echo "Installed Meslo fonts to $DEST_LINUX"
  fc-list | grep -i meslo || true
}

download_and_install_mac() {
  URL="https://github.com/ryanoasis/nerd-fonts/releases/latest/download/Meslo.zip"
  TF="/tmp/Meslo.zip"
  echo "Downloading Meslo Nerd Font from $URL"
  curl -fsSL "$URL" -o "$TF"
  echo ".. extracting to $DEST_MAC"
  unzip -o "$TF" -d "$DEST_MAC" >/dev/null
  rm -f "$TF"
  echo "Installed Meslo fonts to $DEST_MAC"
}

main() {
  case "$(uname)" in
    Linux)
      download_and_install_linux
      ;;
    Darwin)
      download_and_install_mac
      ;;
    MINGW*|MSYS*|CYGWIN*)
      echo "Windows detected. Run the PowerShell script 'scripts/install-meslo-host-fonts.ps1' or follow manual instructions."
      ;;
    *)
      echo "Unsupported OS: $(uname)"
      exit 1
      ;;
  esac

  echo "IMPORTANT: Install the 'MesloLGM Nerd Font' on your host OS (if you use the browser-based Codespaces or VS Code desktop). Restart VS Code and set:\n  terminal.integrated.fontFamily: 'MesloLGM Nerd Font, monospace'\n  editor.fontFamily: 'MesloLGM Nerd Font Mono, MesloLGM Nerd Font, monospace'"
}

main
