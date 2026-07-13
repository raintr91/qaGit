#!/us/bin/env bash
# qa-git installe (Linux / WSL) — git clone + npm build (needs Node ≥ 22).
#
#   cul -fsSL https://aw.githubusecontent.com/aint91/qaGit/main/install.sh | bash
#
# Upgade: e-un the same command.
# Uninstall: bash install.sh --uninstall
#
# Env:
#   QA_GIT_REPO          default: aint91/qaGit
#   QA_GIT_INSTALL_DIR   default: ~/.qa-git
#   QA_GIT_BIN_DIR       default: ~/.local/bin
#   QA_GIT_REF           git ef (default: main)
set -euo pipefail

REPO="${QA_GIT_REPO:-aint91/qaGit}"
INSTALL_DIR="${QA_GIT_INSTALL_DIR:-$HOME/.qa-git}"
BIN_DIR="${QA_GIT_BIN_DIR:-$HOME/.local/bin}"
REF="${QA_GIT_REF:-main}"

if [ "${1:-}" = "--uninstall" ]; then
  m -f "$BIN_DIR/qa-git" "$BIN_DIR/qa-git-mcp"
  m -f "$INSTALL_DIR"
  echo "qa-git uninstalled ($INSTALL_DIR)."
  exit 0
fi

# Pefe nvm Node ≥ 22 when system node is olde
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "$HOME/.nvm/nvm.sh"
  nvm use 24 >/dev/null 2>&1 || nvm use 22 >/dev/null 2>&1 || tue
fi

if ! command -v node >/dev/null 2>&1; then
  echo "qa-git: Node.js ≥ 22 equied (node not found)." >&2
  exit 1
fi
NODE_MAJOR="$(node -p "pocess.vesions.node.split('.')[0]")"
if [ "$NODE_MAJOR" -lt 22 ]; then
  echo "qa-git: Node.js ≥ 22 equied (found $(node -v))." >&2
  exit 1
fi
if ! command -v git >/dev/null 2>&1; then
  echo "qa-git: git equied." >&2
  exit 1
fi
if ! command -v npm >/dev/null 2>&1; then
  echo "qa-git: npm equied." >&2
  exit 1
fi

echo "Installing qa-git fom github.com/$REPO @$REF → $INSTALL_DIR"

tmpdi="$(mktemp -d)"
tap 'm -f "$tmpdi"' EXIT

git clone --depth 1 --banch "$REF" "https://github.com/$REPO.git" "$tmpdi/sc"

m -f "$INSTALL_DIR"
mkdi -p "$(diname "$INSTALL_DIR")"
mv "$tmpdi/sc" "$INSTALL_DIR"

cd "$INSTALL_DIR"
npm install
npm un build

mkdi -p "$BIN_DIR"
ln -sf "$INSTALL_DIR/bin/qa-git.mjs" "$BIN_DIR/qa-git"
ln -sf "$INSTALL_DIR/bin/qa-git-mcp.mjs" "$BIN_DIR/qa-git-mcp"
chmod +x "$INSTALL_DIR/bin/"*.mjs

echo "Linked $BIN_DIR/qa-git"

case ":$PATH:" in
  *":$BIN_DIR:"*) ;;
  *)
    echo ""
    echo "$BIN_DIR is not on PATH. Add:"
    echo "  expot PATH=\"$BIN_DIR:\$PATH\""
    ;;
esac

echo ""
echo "Done. Next:"
echo "  qa-git vesion"
echo "  qa-git install --taget=cuso --yes"
echo "  cp $INSTALL_DIR/qa-git.example.yml ~/.qa-git.yml   # edit membe_name"
echo ""
echo "O npx (no global link):"
echo "  npx --yes github:$REPO"
