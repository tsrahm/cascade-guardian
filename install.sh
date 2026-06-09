#!/usr/bin/env bash
set -euo pipefail

# ─── Cascade Guardian Installer ──────────────────────────────────────────────
#
# Installs Cascade Guardian for devin/cascade integration
# Works on any TypeScript project — install once, works everywhere.
#
# Usage:
#   ./install.sh              # Install from current directory
#   ./install.sh --uninstall  # Remove installation
#

GUARDIAN_HOME="${GUARDIAN_HOME:-$HOME/.cascade-guardian}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION="0.1.0"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info()  { echo -e "${BLUE}[info]${NC}  $1"; }
ok()    { echo -e "${GREEN}[ok]${NC}    $1"; }
warn()  { echo -e "${YELLOW}[warn]${NC}  $1"; }
error() { echo -e "${RED}[error]${NC} $1"; }

# ─── Uninstall ────────────────────────────────────────────────────────────────

if [[ "${1:-}" == "--uninstall" ]]; then
  info "Uninstalling Cascade Guardian..."

  # Remove guardian directory
  if [[ -d "$GUARDIAN_HOME" ]]; then
    rm -rf "$GUARDIAN_HOME"
    ok "Removed $GUARDIAN_HOME"
  else
    warn "$GUARDIAN_HOME not found"
  fi

  ok "Cascade Guardian uninstalled successfully"
  exit 0
fi

# ─── Installation ────────────────────────────────────────────────────────────

info "Installing Cascade Guardian v$VERSION..."

# Check prerequisites
if ! command -v node &> /dev/null; then
  error "Node.js is required but not installed"
  exit 1
fi

if ! command -v npm &> /dev/null; then
  error "npm is required but not installed"
  exit 1
fi

# Create guardian home directory
if [[ -d "$GUARDIAN_HOME" ]]; then
  warn "$GUARDIAN_HOME already exists, backing up..."
  mv "$GUARDIAN_HOME" "${GUARDIAN_HOME}.backup.$(date +%s)"
fi

mkdir -p "$GUARDIAN_HOME"
ok "Created $GUARDIAN_HOME"

# Copy source files
info "Copying source files..."
cp -r "$SCRIPT_DIR/src" "$GUARDIAN_HOME/"
cp "$SCRIPT_DIR/package.json" "$GUARDIAN_HOME/"
cp "$SCRIPT_DIR/tsconfig.json" "$GUARDIAN_HOME/"
cp "$SCRIPT_DIR/README.md" "$GUARDIAN_HOME/" 2>/dev/null || true

# Install dependencies
info "Installing dependencies..."
cd "$GUARDIAN_HOME"
npm install

# Build the project
info "Building Cascade Guardian..."
npm run build

# Create executable script
cat > "$GUARDIAN_HOME/cascade-guardian" << 'EOF'
#!/usr/bin/env node
require('./dist/index.js');
EOF
chmod +x "$GUARDIAN_HOME/cascade-guardian"

# Add to PATH (optional)
if ! grep -q "$GUARDIAN_HOME" "$HOME/.zshrc" 2>/dev/null && ! grep -q "$GUARDIAN_HOME" "$HOME/.bashrc" 2>/dev/null; then
  info "Adding to PATH..."
  echo "" >> "$HOME/.zshrc" 2>/dev/null || echo "" >> "$HOME/.bashrc"
  echo "# Cascade Guardian" >> "$HOME/.zshrc" 2>/dev/null || echo "# Cascade Guardian" >> "$HOME/.bashrc"
  echo "export PATH=\"$GUARDIAN_HOME:\$PATH\"" >> "$HOME/.zshrc" 2>/dev/null || echo "export PATH=\"$GUARDIAN_HOME:\$PATH\"" >> "$HOME/.bashrc"
  ok "Added to PATH (restart terminal or run: source ~/.zshrc)"
fi

# Create version file
echo "$VERSION" > "$GUARDIAN_HOME/.version"

ok "Cascade Guardian installed successfully!"
info ""
info "Usage:"
info "  cascade-guardian build-index [project-path]"
info "  cascade-guardian search [project-path] \"query\""
info ""
info "Example:"
info "  cascade-guardian build-index /path/to/your/project"
info "  cascade-guardian search /path/to/your/project \"user authentication\""
info ""
warn "Remember to restart your terminal to update PATH"
