#!/usr/bin/env bash
# qa-git installer (Linux / WSL) — git clone + npm build (needs Node ≥ 22).
#
#   curl -fsSL https://raw.githubusercontent.com/raintr91/qaGit/main/install.sh | bash
#
# Upgrade: re-run the same command.
# Uninstall: bash install.sh --uninstall
#
# Env:
#   QA_GIT_REPO          default: raintr91/qaGit
#   QA_GIT_INSTALL_DIR   default: ~/.qa-git
#   QA_GIT_BIN_DIR       default: ~/.local/bin
#   QA_GIT_REF           git ref (default: main)
set -euo pipefail

REPO="${QA_GIT_REPO:-raintr91/qaGit}"
INSTALL_DIR="${QA_GIT_INSTALL_DIR:-$HOME/.qa-git}"
BIN_DIR="${QA_GIT_BIN_DIR:-$HOME/.local/bin}"
REF="${QA_GIT_REF:-main}"

if [ "${1:-}" = "--uninstall" ]; then
  rm -f "$BIN_DIR/qa-git" "$BIN_DIR/qa-git-mcp"
  rm -rf "$INSTALL_DIR"
  echo "qa-git uninstalled ($INSTALL_DIR)."
  exit 0
fi

# Prefer nvm Node ≥ 22 when system node is older
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "$HOME/.nvm/nvm.sh"
  nvm use 24 >/dev/null 2>&1 || nvm use 22 >/dev/null 2>&1 || true
fi

if ! command -v node >/dev/null 2>&1; then
  echo "qa-git: Node.js ≥ 22 required (node not found)." >&2
  exit 1
fi
NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [ "$NODE_MAJOR" -lt 22 ]; then
  echo "qa-git: Node.js ≥ 22 required (found $(node -v))." >&2
  exit 1
fi
if ! command -v git >/dev/null 2>&1; then
  echo "qa-git: git required." >&2
  exit 1
fi
if ! command -v npm >/dev/null 2>&1; then
  echo "qa-git: npm required." >&2
  exit 1
fi

echo "Installing qa-git from github.com/$REPO @$REF → $INSTALL_DIR"

tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

git clone --depth 1 --branch "$REF" "https://github.com/$REPO.git" "$tmpdir/src"

rm -rf "$INSTALL_DIR"
mkdir -p "$(dirname "$INSTALL_DIR")"
mv "$tmpdir/src" "$INSTALL_DIR"

cd "$INSTALL_DIR"
npm install
npm run build

mkdir -p "$BIN_DIR"
ln -sf "$INSTALL_DIR/bin/qa-git.mjs" "$BIN_DIR/qa-git"
ln -sf "$INSTALL_DIR/bin/qa-git-mcp.mjs" "$BIN_DIR/qa-git-mcp"
chmod +x "$INSTALL_DIR/bin/"*.mjs

echo "Linked $BIN_DIR/qa-git"

case ":$PATH:" in
  *":$BIN_DIR:"*) ;;
  *)
    echo ""
    echo "$BIN_DIR is not on PATH. Add:"
    echo "  export PATH=\"$BIN_DIR:\$PATH\""
    ;;
esac

echo ""
echo "Done. Next:"
echo "  qa-git version"
echo "  qa-git install --target=auto --yes"
echo "  cd <product-repo> && qa-git init   # ↑↓ space enter · Kilo = not supported"
echo ""
echo "Or npx (no global link):"
echo "  npx --yes github:$REPO"
