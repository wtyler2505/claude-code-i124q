# Claude Code Templates

**Ready-to-use configurations for Claude Code across multiple programming languages and frameworks**

[![npm version](https://badge.fury.io/js/claude-code-templates.svg)](https://badge.fury.io/js/claude-code-templates)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Get started with Claude Code in seconds using our optimized templates and automated installer. No manual configuration needed!

## 🚀 Quick Start

The fastest way to set up Claude Code for your project:

```bash
# Navigate to your project
cd your-project

# Run the installer (no installation required!)
npx create-claude-config
```

That's it! The installer will auto-detect your project type and set up everything for you.

## ✨ Features

- 🔍 **Smart Auto-Detection** - Automatically detects your programming language and framework
- 🎯 **Framework-Specific** - Includes optimized configurations for React, Django, Flask, Node.js, and more
- 💾 **Safe Installation** - Backs up existing files before making changes
- ⚙️ **Interactive Setup** - Choose exactly what you need through guided prompts
- 🚀 **Zero Configuration** - Works out of the box with sensible defaults
- 📦 **No Installation Required** - Uses `npx` for instant access to latest version

## 🛠️ Supported Technologies

### Programming Languages
- **JavaScript/TypeScript** - Modern ES6+, TypeScript, Node.js
- **Python** - Python 3.8+, virtual environments, popular frameworks
- **Rust** - Coming soon
- **Go** - Coming soon
- **Common** - Universal configuration for any language

### Frameworks & Tools

#### JavaScript/TypeScript
- **React** - Hooks, JSX, testing with Jest/Vitest
- **Vue.js** - Composition API, single-file components
- **Angular** - TypeScript, RxJS, Angular CLI
- **Node.js** - Express, Fastify, API development
- **Build Tools** - Vite, Webpack, esbuild, Rollup

#### Python
- **Django** - Models, views, templates, Django REST framework
- **Flask** - Blueprints, SQLAlchemy, Flask-RESTful
- **FastAPI** - Async/await, Pydantic, automatic documentation
- **Testing** - pytest, unittest, coverage
- **Tools** - Black, isort, flake8, mypy

## 📦 What Gets Installed

When you run the installer, it adds these files to your project:

### Core Configuration
- **`CLAUDE.md`** - Main configuration file with language-specific guidance
- **`.claude/settings.json`** - Optimized settings for your language and framework
- **`.claude/commands/`** - Custom commands for common development tasks
- **`.claude/hooks/`** - Automated workflows for formatting, linting, and type checking

### Language-Specific Commands
Each template includes ready-to-use commands for:
- **Testing** - Run unit tests, integration tests, with coverage
- **Code Quality** - Linting, formatting, type checking
- **Building** - Development and production builds
- **Debugging** - Debugging configurations and helpers
- **Framework Operations** - Component generation, migrations, etc.

## 💡 Usage Examples

### Interactive Setup (Recommended)
```bash
cd my-react-app
npx create-claude-config
# The installer detects React and suggests optimal configuration
```

### Quick Setup for Specific Stacks
```bash
# React + TypeScript project
npx create-claude-config --language javascript-typescript --framework react

# Python Django project
npx create-claude-config --language python --framework django

# Node.js API
npx create-claude-config --language javascript-typescript --framework node

# Generic Python project
npx create-claude-config --language python
```

### Advanced Options
```bash
# Preview what would be installed
npx create-claude-config --dry-run

# Skip prompts and use defaults
npx create-claude-config --yes

# Install to different directory
npx create-claude-config --directory /path/to/project
```

## 🎨 Interactive Experience

The installer provides a beautiful, step-by-step setup process:

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

✔ Project detection complete
🔤 Select your programming language: JavaScript/TypeScript
🎯 Select your framework (optional): React
⚙️ Select additional features: Enhanced testing commands, Code linting and formatting
🚀 Setup Claude Code for javascript-typescript with react? Yes
✅ Claude Code configuration setup complete!
```

## 🗂️ Repository Structure

This repository contains optimized templates for different languages and use cases:

```
claude-code-templates/
├── 📦 cli-tool/              # NPM package for automated installation
├── 📁 common/                # Universal templates for any language
├── 📁 javascript-typescript/ # JS/TS templates with framework support
├── 📁 python/                # Python templates with framework support
├── 📁 rust/                  # Rust templates (coming soon)
└── 📁 go/                    # Go templates (coming soon)
```

Each language folder includes:
- **`CLAUDE.md`** - Language-specific configuration and best practices
- **`README.md`** - Detailed setup and usage instructions
- **`.claude/`** - Custom commands, settings, and automation hooks
- **`examples/`** - Framework-specific configurations

## 🛡️ Safety Features

- **Automatic Backups** - Existing `CLAUDE.md` and `.claude/` files are backed up
- **Confirmation Required** - Always asks before making changes
- **Dry Run Mode** - Preview what will be installed with `--dry-run`
- **Cancel Anytime** - Press Ctrl+C or answer 'No' to cancel installation

## 🌟 Why Use Claude Code Templates?

### Before (Manual Setup)
```bash
# Create CLAUDE.md manually
# Research best practices for your language
# Set up custom commands
# Configure linting and formatting
# Add testing workflows
# ... hours of configuration
```

### After (With Our Templates)
```bash
npx create-claude-config
# ✅ Done in 30 seconds!
```

### Benefits
- **Save Time** - Skip hours of configuration research and setup
- **Best Practices** - Use proven configurations optimized by the community
- **Stay Updated** - Always get the latest templates with `npx`
- **Consistency** - Use the same configuration across all your projects
- **Framework-Aware** - Get configurations tailored to your specific stack

## 🚀 Getting Started

### Prerequisites
- Node.js 14+ (for the installer)
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) installed

### Step 1: Install Claude Code
```bash
npm install -g @anthropic-ai/claude-code
```

### Step 2: Set Up Your Project
```bash
cd your-project
npx create-claude-config
```

### Step 3: Start Coding with Claude
```bash
claude
```

## 📚 Manual Installation (Alternative)

If you prefer manual setup, you can copy templates directly:

```bash
# Clone the repository
git clone https://github.com/danipower/claude-code-templates.git

# Copy templates for JavaScript/TypeScript + React
cp -r claude-code-templates/javascript-typescript/CLAUDE.md your-project/
cp -r claude-code-templates/javascript-typescript/.claude/ your-project/
cp -r claude-code-templates/javascript-typescript/examples/react-app/.claude/commands/* your-project/.claude/commands/

# Or copy Python + Django templates
cp -r claude-code-templates/python/CLAUDE.md your-project/
cp -r claude-code-templates/python/.claude/ your-project/
```

## 🤝 Contributing

We welcome contributions! Help us make Claude Code even better for everyone.

### How to Contribute
1. **Fork** this repository
2. **Create** a feature branch (`git checkout -b feature/amazing-template`)
3. **Add** your improvements or new language support
4. **Test** your templates with real projects
5. **Submit** a pull request

### What We're Looking For
- **New Language Support** - Rust, Go, Java, C#, PHP, etc.
- **Framework Templates** - Svelte, Next.js, Nuxt.js, Spring Boot, etc.
- **Improved Commands** - Better testing, deployment, debugging workflows
- **Documentation** - Clearer guides and examples
- **Bug Fixes** - Improvements to existing templates

### Template Guidelines
- Follow the established folder structure
- Include comprehensive `CLAUDE.md` and `README.md` files
- Add practical custom commands in `.claude/commands/`
- Provide real-world examples
- Test with actual projects before submitting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Anthropic** for creating Claude Code
- **The Community** - All contributors who help improve these templates
- **Open Source Projects** - Inspiration from create-react-app, vue-cli, and similar tools

## 📞 Support

- **Issues** - [Report bugs or request features](https://github.com/danipower/claude-code-templates/issues)
- **Discussions** - [Join community discussions](https://github.com/danipower/claude-code-templates/discussions)
- **Documentation** - [Claude Code Official Docs](https://docs.anthropic.com/en/docs/claude-code)

---

**⭐ Found this useful? Give us a star on GitHub!**

**🚀 Ready to supercharge your development with Claude Code? Run `npx create-claude-config` now!**