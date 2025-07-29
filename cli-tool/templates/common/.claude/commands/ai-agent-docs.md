# AI Agent Documentation Generation

Comprehensive technical documentation generation using AI-powered analysis and writing.

## Usage

```bash
# Generate project documentation
claude-code-config --agent-docs

# Interactive mode
claude-code-config --ai-agents
# Then select "Documentation Generation"
```

## Documentation Types

### Project Documentation
- **README.md** - Project overview, installation, and usage
- **API Documentation** - Endpoints, parameters, examples
- **Architecture Guide** - System design and component relationships
- **Contributing Guidelines** - Development workflow and standards

### Code Documentation
- **Inline Comments** - Function and class documentation
- **JSDoc/Docstrings** - Language-specific documentation standards
- **Type Definitions** - Interface and type documentation
- **Usage Examples** - Practical implementation examples

### User Documentation
- **User Guide** - Step-by-step tutorials and workflows
- **FAQ** - Common questions and troubleshooting
- **Migration Guide** - Version upgrade instructions
- **Troubleshooting** - Error resolution and debugging

### Developer Documentation
- **Setup Guide** - Development environment configuration
- **Testing Guide** - Unit, integration, and E2E testing
- **Deployment Guide** - Production deployment instructions
- **Monitoring Guide** - Logging, metrics, and observability

## Features

### Intelligent Content Generation
- Analyzes codebase structure and dependencies
- Extracts API endpoints and generates OpenAPI specs
- Creates accurate code examples and usage patterns
- Maintains consistency across all documentation

### Multi-Format Output
- **Markdown** - Standard documentation format
- **OpenAPI/Swagger** - API specification
- **HTML** - Styled documentation websites
- **JSON** - Structured data for tools integration

### Documentation Standards
- Follows industry best practices and conventions
- Language-specific documentation patterns
- Accessibility guidelines compliance
- SEO optimization for documentation sites

## Interactive Features

The agent can generate:
- **Comprehensive Documentation Suite** - All documentation types
- **Specific Document Types** - Choose what to generate
- **Update Existing Docs** - Refresh outdated documentation
- **API Documentation** - Focus on endpoint documentation

## Customization Options

- **Writing Style** - Technical, beginner-friendly, or conversational
- **Detail Level** - Brief overview or comprehensive guide
- **Target Audience** - Developers, end-users, or administrators
- **Documentation Format** - Markdown, HTML, or integrated formats

## Output Files

Generated documentation includes:
- `README.md` - Main project documentation
- `API.md` - API reference documentation  
- `ARCHITECTURE.md` - System architecture overview
- `CONTRIBUTING.md` - Development guidelines
- `CHANGELOG.md` - Version history template
- `docs/` - Additional documentation files

## Quality Assurance

The agent ensures:
- **Accuracy** - Code examples are tested and working
- **Completeness** - All major features and APIs covered
- **Consistency** - Uniform style and terminology
- **Maintenance** - Easy to update and keep current

## Files Created

- `.claude/agents/reports/documentation-[session-id].json` - Generation report
- `.claude/agents/conversations/documentation-[session-id].json` - Conversation history
- Various documentation files in project root and `docs/` directory

## Integration Benefits

- **CI/CD Integration** - Automated documentation updates
- **Version Control** - Track documentation changes
- **Team Collaboration** - Consistent documentation standards
- **Knowledge Sharing** - Comprehensive project understanding

Uses Claude Code SDK for intelligent analysis of your project structure, API patterns, and codebase to generate accurate, comprehensive, and maintainable documentation.