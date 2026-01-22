#!/usr/bin/env bash
# agentful Unattended Installation Script
# Installs both Claude Code and agentful with full automation
#
# Usage:
#   curl -fsSL https://agentful.app/install.sh | bash
#   curl -fsSL https://agentful.app/install.sh | bash -s -- --unattended

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AGENTFUL_VERSION="${AGENTFUL_VERSION:-latest}"
UNATTENDED=false
SKIP_CLAUDE=false
LLM_PROVIDER=""
API_KEY=""
AUTH_MODE=""
SERVER_PORT="3737"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --unattended)
      UNATTENDED=true
      shift
      ;;
    --skip-claude)
      SKIP_CLAUDE=true
      shift
      ;;
    --llm)
      LLM_PROVIDER="$2"
      shift 2
      ;;
    --api-key)
      API_KEY="$2"
      shift 2
      ;;
    --auth)
      AUTH_MODE="$2"
      shift 2
      ;;
    --port)
      SERVER_PORT="$2"
      shift 2
      ;;
    --help)
      cat <<EOF
agentful Installation Script

Usage:
  curl -fsSL https://agentful.app/install.sh | bash [OPTIONS]

Options:
  --unattended        Non-interactive installation
  --skip-claude       Skip Claude Code installation
  --llm PROVIDER      LLM provider: anthropic, glm, openai, ollama
  --api-key KEY       API key for LLM provider
  --auth MODE         Auth mode for server: tailscale, hmac, ssh
  --port PORT         Server port (default: 3737)
  --help              Show this help message

Examples:
  # Interactive installation
  curl -fsSL https://agentful.app/install.sh | bash

  # Unattended with Anthropic
  curl -fsSL https://agentful.app/install.sh | bash -s -- \\
    --unattended \\
    --llm anthropic \\
    --api-key sk-ant-... \\
    --auth hmac

  # Unattended with GLM (z.ai)
  curl -fsSL https://agentful.app/install.sh | bash -s -- \\
    --unattended \\
    --llm glm \\
    --api-key xxx \\
    --auth tailscale

  # Server only (Claude Code already installed)
  curl -fsSL https://agentful.app/install.sh | bash -s -- \\
    --skip-claude \\
    --unattended \\
    --llm anthropic \\
    --api-key sk-ant-...

Environment Variables (alternative to flags):
  AGENTFUL_LLM          LLM provider
  AGENTFUL_API_KEY      API key
  AGENTFUL_AUTH_MODE    Auth mode
  AGENTFUL_PORT         Server port
EOF
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Run with --help for usage information"
      exit 1
      ;;
  esac
done

# Load from environment if not provided
LLM_PROVIDER="${LLM_PROVIDER:-${AGENTFUL_LLM:-}}"
API_KEY="${API_KEY:-${AGENTFUL_API_KEY:-}}"
AUTH_MODE="${AUTH_MODE:-${AGENTFUL_AUTH_MODE:-}}"

# Helper functions
info() {
  echo -e "${BLUE}ℹ${NC} $*"
}

success() {
  echo -e "${GREEN}✓${NC} $*"
}

warn() {
  echo -e "${YELLOW}⚠${NC} $*"
}

error() {
  echo -e "${RED}✗${NC} $*"
}

prompt() {
  local var_name="$1"
  local prompt_text="$2"
  local default="${3:-}"

  if [[ "$UNATTENDED" == true ]]; then
    if [[ -n "${!var_name}" ]]; then
      return 0
    elif [[ -n "$default" ]]; then
      eval "$var_name=\"$default\""
      return 0
    else
      error "Unattended mode requires --$var_name or default value"
      exit 1
    fi
  fi

  if [[ -n "$default" ]]; then
    read -rp "$prompt_text [$default]: " value
    eval "$var_name=\"${value:-$default}\""
  else
    read -rp "$prompt_text: " value
    eval "$var_name=\"$value\""
  fi
}

# Detect OS
detect_os() {
  case "$(uname -s)" in
    Linux*)     echo "linux";;
    Darwin*)    echo "macos";;
    MINGW*|MSYS*|CYGWIN*)     echo "windows";;
    *)          echo "unknown";;
  esac
}

OS="$(detect_os)"

# Banner
cat <<'EOF'
     _                    _    __       _
    / \   __ _  ___ _ __ | |_ / _|_   _| |
   / _ \ / _` |/ _ \ '_ \| __| |_| | | | |
  / ___ \ (_| |  __/ | | | |_|  _| |_| | |
 /_/   \_\__, |\___|_| |_|\__|_|  \__,_|_|
         |___/

 Autonomous Product Development with Claude Code

EOF

info "Starting installation..."
info "OS: $OS"

# Step 1: Install Claude Code
if [[ "$SKIP_CLAUDE" != true ]]; then
  info "Installing Claude Code..."

  if command -v claude &> /dev/null; then
    success "Claude Code already installed ($(claude --version 2>/dev/null || echo 'unknown'))"
  else
    case "$OS" in
      linux|macos)
        info "Downloading Claude Code installer..."
        if curl -fsSL https://claude.ai/install.sh | bash; then
          success "Claude Code installed"
        else
          error "Claude Code installation failed"
          exit 1
        fi
        ;;
      windows)
        error "Windows installation not supported via this script"
        error "Please install manually from: https://code.claude.com/"
        exit 1
        ;;
      *)
        error "Unsupported OS: $OS"
        exit 1
        ;;
    esac
  fi

  # Add to PATH
  export PATH="$HOME/.local/bin:$PATH"
else
  info "Skipping Claude Code installation"
fi

# Step 2: Install agentful
info "Installing agentful..."

if command -v npm &> /dev/null; then
  if npm install -g @itz4blitz/agentful@"${AGENTFUL_VERSION}"; then
    success "agentful installed"
  else
    error "agentful installation failed"
    exit 1
  fi
else
  error "npm not found. Please install Node.js first:"
  error "https://nodejs.org/"
  exit 1
fi

# Step 3: Configure LLM Provider
if [[ "$UNATTENDED" != true ]]; then
  echo ""
  info "LLM Provider Configuration"
  echo ""
  echo "Choose your LLM provider:"
  echo "  1) Anthropic Claude (default, pay-as-you-go)"
  echo "  2) GLM via z.ai (Anthropic-compatible)"
  echo "  3) OpenAI GPT (requires proxy)"
  echo "  4) Ollama (local)"
  echo "  5) Skip (configure later)"
  echo ""

  read -rp "Select [1-5]: " llm_choice

  case "$llm_choice" in
    1|"")
      LLM_PROVIDER="anthropic"
      read -rp "Anthropic API Key (sk-ant-...): " API_KEY
      ;;
    2)
      LLM_PROVIDER="glm"
      read -rp "GLM API Key: " API_KEY
      ;;
    3)
      LLM_PROVIDER="openai"
      read -rp "OpenAI API Key: " API_KEY
      ;;
    4)
      LLM_PROVIDER="ollama"
      read -rp "Ollama model name [llama3.1]: " OLLAMA_MODEL
      OLLAMA_MODEL="${OLLAMA_MODEL:-llama3.1}"
      ;;
    5)
      info "Skipping LLM configuration"
      LLM_PROVIDER=""
      ;;
    *)
      error "Invalid choice"
      exit 1
      ;;
  esac
fi

# Step 4: Configure API Key
if [[ -n "$LLM_PROVIDER" && -n "$API_KEY" ]]; then
  info "Configuring API key..."

  # Create .claude directory
  mkdir -p "$HOME/.claude"

  # Configure based on provider
  case "$LLM_PROVIDER" in
    anthropic)
      cat > "$HOME/.claude/settings.json" <<EOF
{
  "env": {
    "ANTHROPIC_API_KEY": "\${ANTHROPIC_API_KEY}",
    "DISABLE_TELEMETRY": "1",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  },
  "model": "claude-sonnet-4-5-20250929"
}
EOF

      # Add to shell profile
      SHELL_RC=""
      if [[ -f "$HOME/.zshrc" ]]; then
        SHELL_RC="$HOME/.zshrc"
      elif [[ -f "$HOME/.bashrc" ]]; then
        SHELL_RC="$HOME/.bashrc"
      fi

      if [[ -n "$SHELL_RC" ]]; then
        if ! grep -q "ANTHROPIC_API_KEY" "$SHELL_RC"; then
          echo "" >> "$SHELL_RC"
          echo "# agentful API key" >> "$SHELL_RC"
          echo "export ANTHROPIC_API_KEY=\"$API_KEY\"" >> "$SHELL_RC"
          success "API key added to $SHELL_RC"
        fi
      fi

      export ANTHROPIC_API_KEY="$API_KEY"
      ;;

    glm)
      cat > "$HOME/.claude/settings.json" <<EOF
{
  "env": {
    "ANTHROPIC_API_KEY": "\${ANTHROPIC_API_KEY}",
    "ANTHROPIC_BASE_URL": "https://api.z.ai/api/anthropic",
    "DISABLE_TELEMETRY": "1"
  },
  "model": "glm-4-plus"
}
EOF

      export ANTHROPIC_API_KEY="$API_KEY"
      export ANTHROPIC_BASE_URL="https://api.z.ai/api/anthropic"
      ;;

    openai)
      warn "OpenAI requires a proxy server to translate to Anthropic format"
      info "See: https://github.com/anthropics/anthropic-sdk-python#openai-compatibility"
      ;;

    ollama)
      cat > "$HOME/.claude/settings.json" <<EOF
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://localhost:11434/api",
    "DISABLE_TELEMETRY": "1"
  },
  "model": "${OLLAMA_MODEL:-llama3.1}"
}
EOF
      ;;
  esac

  success "LLM provider configured: $LLM_PROVIDER"
fi

# Step 5: Initialize agentful in current directory (optional)
echo ""
if [[ "$UNATTENDED" != true ]]; then
  read -rp "Initialize agentful in current directory? [Y/n]: " init_choice
  init_choice="${init_choice:-y}"
else
  init_choice="n"
fi

if [[ "$init_choice" =~ ^[Yy] ]]; then
  info "Initializing agentful..."
  if agentful init --yes; then
    success "agentful initialized in $(pwd)"
  else
    error "agentful initialization failed"
  fi
fi

# Step 6: Configure remote server (optional)
echo ""
if [[ "$UNATTENDED" != true ]]; then
  read -rp "Configure agentful remote server? [y/N]: " server_choice
  server_choice="${server_choice:-n}"
else
  server_choice="${AUTH_MODE:+y}"
fi

if [[ "$server_choice" =~ ^[Yy] ]]; then
  info "Remote server configuration"
  echo ""

  if [[ -z "$AUTH_MODE" ]]; then
    echo "Choose authentication mode:"
    echo "  1) Tailscale (recommended for VPS)"
    echo "  2) HMAC (secure with shared secret)"
    echo "  3) SSH tunnel (localhost + ssh -L)"
    echo ""
    read -rp "Select [1-3]: " auth_choice

    case "$auth_choice" in
      1) AUTH_MODE="tailscale" ;;
      2) AUTH_MODE="hmac" ;;
      3) AUTH_MODE="ssh" ;;
      *)
        error "Invalid choice"
        exit 1
        ;;
    esac
  fi

  # Generate HMAC secret if needed
  HMAC_SECRET=""
  if [[ "$AUTH_MODE" == "hmac" ]]; then
    if command -v openssl &> /dev/null; then
      HMAC_SECRET="$(openssl rand -hex 32)"
      success "Generated HMAC secret"
    else
      read -rp "HMAC secret (min 32 chars): " HMAC_SECRET
    fi
  fi

  # Create agentful config
  mkdir -p "$HOME/.agentful"

  cat > "$HOME/.agentful/config.json" <<EOF
{
  "llm": {
    "provider": "${LLM_PROVIDER:-anthropic}",
    "apiKey": "\${AGENTFUL_API_KEY}",
    $(if [[ "$LLM_PROVIDER" == "glm" ]]; then echo "\"baseURL\": \"https://api.z.ai/api/anthropic\","; fi)
    "model": "$(case "$LLM_PROVIDER" in
      anthropic) echo "claude-sonnet-4-5-20250929" ;;
      glm) echo "glm-4-plus" ;;
      openai) echo "gpt-4o" ;;
      ollama) echo "${OLLAMA_MODEL:-llama3.1}" ;;
      *) echo "claude-sonnet-4-5-20250929" ;;
    esac)"
  },
  "server": {
    "port": ${SERVER_PORT},
    "auth": "${AUTH_MODE}",
    $(if [[ "$AUTH_MODE" == "hmac" && -n "$HMAC_SECRET" ]]; then echo "\"hmacSecret\": \"$HMAC_SECRET\","; fi)
    "rateLimit": {
      "windowMs": 60000,
      "max": 60
    }
  },
  "execution": {
    "maxWorkers": 6,
    "maxMemoryMB": 2048,
    "timeout": 600000
  }
}
EOF

  success "Server configuration saved to ~/.agentful/config.json"

  if [[ "$AUTH_MODE" == "hmac" ]]; then
    echo ""
    warn "IMPORTANT: Save your HMAC secret securely"
    echo ""
    echo "  HMAC Secret: $HMAC_SECRET"
    echo ""
    echo "Clients must include this in requests:"
    echo "  export AGENTFUL_SECRET=\"$HMAC_SECRET\""
    echo ""
  fi

  # Offer to start server
  if [[ "$UNATTENDED" != true ]]; then
    read -rp "Start server now? [y/N]: " start_choice
    if [[ "$start_choice" =~ ^[Yy] ]]; then
      info "Starting agentful server..."
      echo ""
      echo "Press Ctrl+C to stop"
      echo ""

      export AGENTFUL_API_KEY="${API_KEY}"
      agentful serve
    else
      echo ""
      info "To start server manually:"
      echo ""
      echo "  export AGENTFUL_API_KEY=\"<your-api-key>\""
      if [[ "$AUTH_MODE" == "hmac" ]]; then
        echo "  export AGENTFUL_SECRET=\"$HMAC_SECRET\""
      fi
      echo "  agentful serve"
      echo ""
    fi
  fi
fi

# Final summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
success "Installation complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [[ -n "$LLM_PROVIDER" ]]; then
  info "LLM Provider: $LLM_PROVIDER"
fi

if [[ -n "$AUTH_MODE" ]]; then
  info "Server Auth: $AUTH_MODE"
  info "Server Port: $SERVER_PORT"
fi

echo ""
echo "Next steps:"
echo ""

if [[ -z "$LLM_PROVIDER" ]]; then
  echo "  1. Configure LLM provider:"
  echo "     export ANTHROPIC_API_KEY=\"sk-ant-...\""
  echo ""
fi

echo "  2. Initialize a project:"
echo "     cd your-project"
echo "     agentful init"
echo ""

echo "  3. Start development:"
echo "     claude"
echo "     > /agentful-start"
echo ""

if [[ -n "$AUTH_MODE" ]]; then
  echo "  4. Start remote server:"
  if [[ -z "$API_KEY" ]]; then
    echo "     export AGENTFUL_API_KEY=\"<your-api-key>\""
  fi
  if [[ "$AUTH_MODE" == "hmac" ]]; then
    echo "     export AGENTFUL_SECRET=\"$HMAC_SECRET\""
  fi
  echo "     agentful serve"
  echo ""
fi

echo "Documentation: https://agentful.app"
echo "GitHub: https://github.com/itz4blitz/agentful"
echo ""
