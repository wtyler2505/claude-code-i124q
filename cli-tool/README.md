# Claude Code Templates Installer

A CLI tool to quickly setup Claude Code configurations for different programming languages and frameworks. No installation required - just use `npx`!

## 🚀 Quick Start

The fastest way to get started is with `npx` (no installation required):

```bash
# Navigate to your project directory
cd your-project

# Run the installer
npx create-claude-config
```

## 📋 How to Use

### Step 1: Navigate to Your Project
```bash
cd your-project-directory
```

### Step 2: Run the Installer
```bash
npx create-claude-config
```

### Step 3: Follow the Interactive Setup
The installer will:
1. 🔍 **Auto-detect** your project type (JavaScript, Python, etc.)
2. 🎯 **Ask about frameworks** (React, Django, Flask, etc.)
3. ⚙️ **Let you choose features** (testing, linting, debugging)
4. ✅ **Confirm before installing**

### Step 4: Start Using Claude Code
```bash
claude
```

## 💡 Usage Examples

### Interactive Setup (Recommended)
```bash
cd my-react-app
npx create-claude-config
# Follow the prompts - it will detect React automatically!
```

### Quick Setup for Specific Languages
```bash
# React project
cd my-react-app
npx create-claude-config --language javascript-typescript --framework react

# Python Django project  
cd my-django-app
npx create-claude-config --language python --framework django

# Node.js API
cd my-api
npx create-claude-config --language javascript-typescript --framework node

# Generic Python project
cd my-python-project
npx create-claude-config --language python
```

### Advanced Options
```bash
# Skip all prompts and use defaults
npx create-claude-config --yes

# See what would be installed without actually installing
npx create-claude-config --dry-run

# Install to a different directory
npx create-claude-config --directory /path/to/project

# Get help
npx create-claude-config --help
```

## 🔄 Alternative Commands

All these commands work exactly the same way:
```bash
npx create-claude-config     # ✅ Recommended (follows npm convention)
npx claude-code-templates    # Package name
npx claude-init              # Short alias
```

## ⚡ No Installation Required

**Why use `npx`?**
- ✅ Always gets the latest version
- ✅ No global installation needed
- ✅ Works on any machine with Node.js
- ✅ Follows npm best practices

If you prefer global installation:
```bash
npm install -g claude-code-templates
create-claude-config
```

## Supported Languages

- **Common** - Universal configuration for any project
- **JavaScript/TypeScript** - Modern JS/TS development with frameworks
- **Python** - Python development with popular frameworks
- **Rust** - Coming soon
- **Go** - Coming soon

## Supported Frameworks

### JavaScript/TypeScript
- React
- Vue.js
- Angular
- Node.js

### Python
- Django
- Flask
- FastAPI

## Features

- 🔍 **Auto-detection** - Automatically detects your project type
- 🎯 **Framework-specific** - Includes framework-specific commands and configurations
- 💾 **Backup existing files** - Safely backs up existing CLAUDE.md and .claude directories
- ⚙️ **Customizable** - Interactive prompts for feature selection
- 🚀 **Quick setup** - Get started with Claude Code in seconds

## What Gets Installed

### Core Files
- `CLAUDE.md` - Main configuration file for Claude Code
- `.claude/settings.json` - Language-specific settings
- `.claude/commands/` - Custom commands for common tasks
- `.claude/hooks/` - Automated hooks for development workflow

### Language-Specific Commands
Each language template includes optimized commands for:
- Testing
- Linting and formatting
- Building and deployment
- Debugging
- Framework-specific operations

## 📱 What Happens During Setup

### Interactive Experience
```bash
$ npx create-claude-config

 ██████╗██╗      █████╗ ██╗   ██╗██████╗ ███████╗
██╔════╝██║     ██╔══██╗██║   ██║██╔══██╗██╔════╝
██║     ██║     ███████║██║   ██║██║  ██║█████╗  
██║     ██║     ██╔══██║██║   ██║██║  ██║██╔══╝  
╚██████╗███████╗██║  ██║╚██████╔╝██████╔╝███████╗
 ╚═════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝

 ██████╗ ██████╗ ██████╗ ███████╗
██╔════╝██╔═══██╗██╔══██╗██╔════╝
██║     ██║   ██║██║  ██║█████╗  
██║     ██║   ██║██║  ██║██╔══╝  
╚██████╗╚██████╔╝██████╔╝███████╗
 ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝

████████╗███████╗███╗   ███╗██████╗ ██╗      █████╗ ████████╗███████╗███████╗
╚══██╔══╝██╔════╝████╗ ████║██╔══██╗██║     ██╔══██╗╚══██╔══╝██╔════╝██╔════╝
   ██║   █████╗  ██╔████╔██║██████╔╝██║     ███████║   ██║   █████╗  ███████╗
   ██║   ██╔══╝  ██║╚██╔╝██║██╔═══╝ ██║     ██╔══██║   ██║   ██╔══╝  ╚════██║
   ██║   ███████╗██║ ╚═╝ ██║██║     ███████╗██║  ██║   ██║   ███████╗███████║
   ╚═╝   ╚══════╝╚═╝     ╚═╝╚═╝     ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚══════╝

                    🚀 Setup Claude Code for any project language 🚀

🚀 Setting up Claude Code configuration...
Target directory: /path/to/your/project
✔ Project detection complete
🔤 Select your programming language: (Use arrow keys)
❯ JavaScript/TypeScript
  Python  
  Common (Language-agnostic)
  Rust (Coming Soon)
  Go (Coming Soon)
```

### Step-by-Step Walkthrough

1. **Project Detection** 📡
   ```
   ✔ Project detection complete
   ```
   - Scans your project for `package.json`, `requirements.txt`, etc.
   - Auto-suggests the best language template

2. **Language Selection** 🔤
   ```
   🔤 Select your programming language: JavaScript/TypeScript
   ```
   - Choose from available languages
   - Auto-selected based on detection

3. **Framework Selection** 🎯
   ```
   🎯 Select your framework (optional): React
   ```
   - Shows relevant frameworks for your language
   - Auto-detected from dependencies

4. **Feature Selection** ⚙️
   ```
   ⚙️ Select additional features: 
   ◉ Enhanced testing commands
   ◉ Code linting and formatting  
   ◯ Git hooks integration
   ◯ Debugging helpers
   ```

5. **Final Confirmation** 🚀
   ```
   🚀 Setup Claude Code for javascript-typescript with react? (Y/n)
   ```
   - Review your choices
   - Type 'n' to cancel, 'y' or Enter to proceed

6. **Installation** 📁
   ```
   📋 Existing CLAUDE.md backed up to CLAUDE.md.backup
   ✓ Copied javascript-typescript/CLAUDE.md → CLAUDE.md
   ✓ Copied javascript-typescript/.claude → .claude
   ✓ Copied react-specific commands → .claude/commands
   ✅ Claude Code configuration setup complete!
   ```

## 🛡️ Safe Installation

- **Backup Protection**: Existing files are safely backed up
- **Confirmation Required**: Always asks before making changes  
- **Dry Run Option**: Preview changes with `--dry-run`
- **Cancel Anytime**: Press Ctrl+C or answer 'No' to cancel

## CLI Options

| Option | Description | Example |
|--------|-------------|---------|
| `-l, --language` | Specify programming language | `--language python` |
| `-f, --framework` | Specify framework | `--framework react` |
| `-d, --directory` | Target directory | `--directory /path/to/project` |
| `-y, --yes` | Skip prompts and use defaults | `--yes` |
| `--dry-run` | Show what would be copied | `--dry-run` |
| `--help` | Show help information | `--help` |

## Development

### Setup
```bash
git clone https://github.com/your-username/claude-code-templates.git
cd claude-code-templates/cli-tool
npm install
```

### Testing
```bash
# Test locally
npm start

# Test with specific options
npm start -- --language python --framework django
```

### Publishing
```bash
npm publish
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License