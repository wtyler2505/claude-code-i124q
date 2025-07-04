# Create Claude Config

A CLI tool to quickly setup Claude Code configurations for different programming languages and frameworks.

## Installation

```bash
# Install globally (optional)
npm install -g claude-config-init

# Or use with npx (recommended)
npx create-claude-config
```

## Usage

### Interactive Setup
```bash
# Run in your project directory
npx create-claude-config

# Or specify a target directory
npx create-claude-config --directory /path/to/your/project
```

### Command Line Options
```bash
# Quick setup with specific language
npx create-claude-config --language javascript-typescript --framework react

# Skip prompts and use defaults
npx create-claude-config --yes

# See what would be copied without actually copying
npx create-claude-config --dry-run

# Show help
npx create-claude-config --help
```

### Alternative Commands
```bash
# All these commands work the same way:
npx create-claude-config     # Recommended (follows npm convention)
npx claude-config-init       # Package name
npx claude-init              # Short alias
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

## Example Usage

```bash
# Setup for a React project
cd my-react-app
npx create-claude-config --language javascript-typescript --framework react

# Setup for a Python Django project
cd my-django-app
npx create-claude-config --language python --framework django

# Interactive setup (recommended)
cd my-project
npx create-claude-config
```

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