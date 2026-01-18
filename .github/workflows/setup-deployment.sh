#!/bin/bash

# Agentful Deployment Setup Script
# This script helps set up the automated deployment system

set -e

echo "🚀 Agentful Deployment Setup"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✓${NC} Node.js: $NODE_VERSION"

# Check if version is 18+
if [[ ! "$NODE_VERSION" =~ v1[89].* ]] && [[ ! "$NODE_VERSION" =~ v2[0-9].* ]]; then
    echo -e "${YELLOW}⚠️  Warning: Node.js 18+ is recommended${NC}"
fi

# Check git
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Git: $(git --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} npm: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing semantic-release dependencies..."
npm install --save-dev \
    semantic-release \
    @semantic-release/git \
    @semantic-release/changelog \
    @semantic-release/npm \
    @semantic-release/github \
    @semantic-release/commit-analyzer \
    @semantic-release/release-notes-generator

echo -e "${GREEN}✓${NC} Dependencies installed"
echo ""

# Create CHANGELOG.md if it doesn't exist
if [ ! -f "CHANGELOG.md" ]; then
    echo "📝 Creating CHANGELOG.md..."
    touch CHANGELOG.md
    echo -e "${GREEN}✓${NC} CHANGELOG.md created"
else
    echo -e "${YELLOW}ℹ️  CHANGELOG.md already exists${NC}"
fi

echo ""
echo "🔑 GitHub Secrets Setup"
echo "=============================="
echo ""
echo "You need to add the following secrets to your GitHub repository:"
echo "  Go to: Settings → Secrets and variables → Actions"
echo ""
echo "1. ${YELLOW}NPM_TOKEN${NC}"
echo "   - Create at: https://www.npmjs.com/settings/tokens"
echo "   - Select: Automation"
echo "   - Copy token and add to GitHub secrets"
echo ""
echo "2. ${YELLOW}CLOUDFLARE_API_TOKEN${NC}"
echo "   - Create at: https://dash.cloudflare.com/profile/api-tokens"
echo "   - Template: Edit Cloudflare Workers"
echo "   - Permissions: Account → Cloudflare Pages → Edit"
echo "   - Copy token and add to GitHub secrets"
echo ""
echo "3. ${YELLOW}CLOUDFLARE_ACCOUNT_ID${NC}"
echo "   - Find at: https://dash.cloudflare.com (right sidebar)"
echo "   - Or: Workers & Pages → Overview → Account ID"
echo "   - Copy ID and add to GitHub secrets"
echo ""

# Prompt to continue
read -p "Have you added all GitHub secrets? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚠️  Please add the secrets before continuing${NC}"
    echo "Run this script again after adding secrets"
    exit 1
fi

echo ""
echo "🔧 Cloudflare Pages Setup"
echo "=============================="
echo ""
echo "You need to create a Cloudflare Pages project:"
echo ""
echo "1. Go to: https://dash.cloudflare.com"
echo "2. Navigate to: Workers & Pages"
echo "3. Click: Create application → Pages"
echo "4. Connect to Git (select your repository)"
echo "5. Configure:"
echo "   - Project name: agentful"
echo "   - Production branch: main"
echo "   - Build command: npm run docs:build"
echo "   - Build output directory: docs/.vocs/dist"
echo "6. Click: Save and Deploy"
echo ""
echo "Custom Domain (optional):"
echo "1. In Pages project, go to Custom domains"
echo "2. Add domain: agentful.app"
echo "3. Follow DNS instructions"
echo ""

# Test semantic-release
echo ""
echo "🧪 Testing Configuration"
echo "=============================="
echo ""
echo "Running semantic-release in dry-run mode..."
echo ""

npm run release:dry-run || {
    echo ""
    echo -e "${YELLOW}⚠️  Dry run completed with warnings${NC}"
    echo "This is normal for first-time setup"
}

echo ""
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo "Next Steps:"
echo "1. Add conventional commits to trigger releases:"
echo "   git commit -m 'feat: add new feature'"
echo "   git commit -m 'fix: resolve bug'"
echo ""
echo "2. Push to main branch to trigger workflows:"
echo "   git push origin main"
echo ""
echo "3. Monitor workflows at:"
echo "   https://github.com/$(git config remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/actions"
echo ""
echo "4. View documentation at:"
echo "   https://agentful.app"
echo ""
echo "📚 For detailed setup guide, see: DEPLOYMENT.md"
echo ""
