# AI Agent Code Review

Comprehensive code review using AI-powered analysis for security, best practices, and architecture recommendations.

## Usage

```bash
# Run comprehensive code review
claude-code-config --agent-review

# Interactive mode
claude-code-config --ai-agents
# Then select "Code Review"
```

## What it analyzes

- **Security vulnerabilities** - OWASP top 10, injection attacks, XSS, CSRF
- **Code quality** - Maintainability, readability, code smells
- **Best practices** - Language-specific conventions and patterns
- **Architecture** - Design patterns, SOLID principles, separation of concerns
- **Performance** - Potential bottlenecks and inefficiencies
- **Dependencies** - Outdated or vulnerable packages

## Review Categories

### Critical Issues
- Security vulnerabilities
- Data exposure risks
- Authentication/authorization flaws

### Quality Improvements
- Code duplication
- Complex functions that need refactoring
- Missing error handling

### Best Practices
- Naming conventions
- Code organization
- Documentation standards

## Output

The agent generates:
- Detailed report with findings and recommendations
- Security vulnerability assessment with severity ratings
- Actionable code improvements with examples
- Architecture recommendations
- JSON report for CI/CD integration

## Files Created

- `.claude/agents/reports/code-review-[session-id].json` - Detailed JSON report
- `.claude/agents/conversations/codereview-[session-id].json` - Conversation history

## Integration

This command uses the Claude Code SDK to provide intelligent, context-aware code analysis that understands your entire project structure and dependencies.