# JavaScript/TypeScript Claude Code Templates

This template provides optimized Claude Code configurations for JavaScript and TypeScript development, including modern frameworks like React, Vue, Node.js, and more.

## Quick Start

### Installation
Copy the template files to your JavaScript/TypeScript project:

```bash
# Copy all template files
cp -r claude-code-templates/javascript-typescript/* your-project/

# Or copy specific files
cp claude-code-templates/javascript-typescript/CLAUDE.md your-project/
cp -r claude-code-templates/javascript-typescript/.claude/ your-project/
```

### Usage
Navigate to your project and start Claude Code:

```bash
cd your-project
claude
```

Use the included custom commands:
```bash
# Run tests
/test

# Run linting
/lint

# Create React component
/react-component

# Debug application
/debug
```

## What's Included

### Core Configuration
- **`CLAUDE.md`** - Comprehensive guidance for JavaScript/TypeScript development
- **`.claude/settings.json`** - Optimized settings for JS/TS projects
- **Custom Commands** - Pre-configured commands for common development tasks

### Development Hooks
- **`format-on-save.json`** - Automatically format code with Prettier
- **`lint-on-save.json`** - Run ESLint on file changes
- **`typescript-check.json`** - Verify TypeScript types on save

### Custom Commands
- **`test.md`** - Execute tests with Jest, Vitest, or other frameworks
- **`lint.md`** - Run ESLint with customizable rules
- **`debug.md`** - Debug Node.js applications and browser code
- **`refactor.md`** - Refactor code with AI assistance
- **`typescript-migrate.md`** - Migrate JavaScript files to TypeScript
- **`npm-scripts.md`** - Manage and execute npm scripts
- **`react-component.md`** - Generate React components with best practices
- **`api-endpoint.md`** - Create API endpoints for Node.js applications

### Project Examples
- **React App** - Configuration for React applications
- **Node.js API** - Configuration for backend API development

## Framework-Specific Setup

### React Projects
```bash
# Copy React-specific configuration
cp -r claude-code-templates/javascript-typescript/examples/react-app/.claude/ your-react-app/
```

Additional commands for React:
- `/component` - Create React components
- `/hooks` - Generate custom React hooks

### Node.js API Projects
```bash
# Copy Node.js-specific configuration
cp -r claude-code-templates/javascript-typescript/examples/node-api/.claude/ your-api-project/
```

Additional commands for Node.js:
- `/route` - Create API routes
- `/middleware` - Generate middleware functions

## Supported Tools and Frameworks

### Package Managers
- **npm** - Node Package Manager
- **yarn** - Fast, reliable package manager
- **pnpm** - Efficient package manager

### Build Tools
- **Vite** - Next generation frontend tooling
- **Webpack** - Module bundler
- **Rollup** - Module bundler for libraries
- **esbuild** - Extremely fast JavaScript bundler

### Testing Frameworks
- **Jest** - JavaScript testing framework
- **Vitest** - Fast unit test framework
- **Testing Library** - Testing utilities
- **Cypress** - End-to-end testing
- **Playwright** - Cross-browser testing

### Code Quality
- **ESLint** - JavaScript/TypeScript linter
- **Prettier** - Code formatter
- **TypeScript** - Static type checking
- **Husky** - Git hooks

### Frontend Frameworks
- **React** - UI library
- **Vue.js** - Progressive framework
- **Angular** - Full-featured framework
- **Svelte** - Compile-time framework

### Backend Frameworks
- **Express.js** - Web framework for Node.js
- **Fastify** - Fast and low overhead web framework
- **Koa** - Lightweight web framework
- **NestJS** - Progressive Node.js framework

## Common Development Workflows

### Setting Up a New Project
1. Initialize project: `npm init` or `yarn init`
2. Install dependencies: `npm install` or `yarn install`
3. Copy Claude Code templates
4. Configure ESLint and Prettier
5. Set up testing framework
6. Configure build tools

### Daily Development
1. Start development server: `npm run dev`
2. Use Claude Code commands for common tasks
3. Run tests: `/test`
4. Format and lint code: `/lint`
5. Debug issues: `/debug`

### Code Quality Checks
1. Type checking: `npm run typecheck`
2. Linting: `npm run lint`
3. Testing: `npm run test`
4. Build verification: `npm run build`

## Customization

### Modifying Commands
Edit files in `.claude/commands/` to customize commands for your workflow:

```bash
# Edit test command
vim .claude/commands/test.md

# Add new custom command
echo "# My Custom Command" > .claude/commands/my-command.md
```

### Adjusting Settings
Modify `.claude/settings.json` to match your project preferences:

```json
{
  "language": "typescript",
  "framework": "react",
  "testFramework": "jest",
  "packageManager": "npm"
}
```

### Adding Hooks
Create custom hooks in `.claude/hooks/` for automated tasks:

```json
{
  "trigger": "on_file_save",
  "pattern": "*.ts,*.tsx",
  "command": "npm run typecheck"
}
```

## Best Practices

### Project Structure
- Use clear, descriptive folder names
- Separate concerns (components, utils, services)
- Follow framework conventions
- Keep configuration files in project root

### Code Quality
- Enable TypeScript strict mode
- Use ESLint with recommended rules
- Format code consistently with Prettier
- Write comprehensive tests

### Performance
- Implement code splitting for large applications
- Use lazy loading for routes and components
- Optimize bundle size regularly
- Monitor runtime performance

## Troubleshooting

### Common Issues
- **TypeScript errors**: Run `npm run typecheck` to identify issues
- **Linting failures**: Use `npm run lint:fix` to auto-fix issues
- **Test failures**: Run tests in watch mode with `npm run test:watch`
- **Build errors**: Check dependencies and configuration files

### Getting Help
- Check the main repository documentation
- Review framework-specific guides
- Use Claude Code's built-in help: `/help`
- Consult community resources and documentation

## Contributing

Found ways to improve these templates? We welcome contributions:

1. Fork the repository
2. Create a feature branch
3. Add your improvements
4. Test with real projects
5. Submit a pull request

## License

This template is part of the Claude Code Templates project and is licensed under the MIT License.