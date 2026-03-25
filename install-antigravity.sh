#!/bin/bash
# Antigravity System Orchestrator - Installation Script
# Scope: Project-level Local Agent + Global CLI

set -e

echo "--- ⬛ INITIALIZING ANTIGRAVITY INSTALLATION ---"

# 1. System Dependency Check & Repo Injection
if [ -f /etc/debian_version ]; then
    echo "[System] Detected Debian/Ubuntu. Configuring APT..."
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://us-central1-apt.pkg.dev/doc/repo-signing-key.gpg | \
    sudo gpg --dearmor --yes -o /etc/apt/keyrings/antigravity-repo-key.gpg
    echo "deb [signed-by=/etc/apt/keyrings/antigravity-repo-key.gpg] https://us-central1-apt.pkg.dev/projects/antigravity-auto-updater-dev/ debian main" | \
    sudo tee /etc/apt/sources.list.d/antigravity.list
    sudo apt update && sudo apt install -y antigravity

elif [ -f /etc/redhat-release ]; then
    echo "[System] Detected RHEL/Fedora. Configuring DNF..."
    sudo tee /etc/yum.repos.d/antigravity.repo << EOL
[antigravity-rpm]
name=Antigravity RPM Repository
baseurl=https://us-central1-yum.pkg.dev/projects/antigravity-auto-updater-dev/antigravity-rpm
enabled=1
gpgcheck=0
EOL
    sudo dnf makecache && sudo dnf install -y antigravity
fi

# 2. Project-Level Initialization (The Fractal Memory)
# This installs the .agent/ folder directly in your current directory
echo "[Project] Injecting Agent Logic into $(pwd)..."
if command -v npx &> /dev/null; then
    # This command scaffolds the .agent/ folder, rules, and skills
    npx antigravity-ide init .
else
    echo "⚠️ Error: npm/npx not found. Ensure Node.js 18+ is installed."
    exit 1
fi

# 3. Create CLI Symlink for fast access
echo "[System] Creating 'agy' symlink..."
sudo ln -sf $(which antigravity) /usr/local/bin/agy

echo "--- ✅ ANTIGRAVITY INSTALLED & INITIALIZED ---"
echo "Run 'agy .' to launch the IDE in this folder."