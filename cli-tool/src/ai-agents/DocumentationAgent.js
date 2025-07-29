const ClaudeAgent = require('./ClaudeAgent');
const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');

/**
 * Documentation Agent - Specialized for generating comprehensive technical documentation
 */
class DocumentationAgent extends ClaudeAgent {
  constructor(options = {}) {
    const systemPrompt = `You are a technical writing expert and documentation specialist with expertise in:
- API documentation (OpenAPI/Swagger, REST, GraphQL)
- Code documentation and inline comments
- README files and project documentation
- User guides and tutorials
- Architecture documentation and system design
- Code examples and usage patterns
- Documentation best practices and standards
- Multi-language documentation (JSDoc, Sphinx, rustdoc, godoc)
- Interactive documentation and live examples
- Documentation maintenance and versioning

When creating documentation, provide:
1. Clear, concise, and comprehensive explanations
2. Practical code examples with working implementations
3. Proper formatting using Markdown, JSDoc, or appropriate standards
4. User-focused content that addresses common use cases
5. Well-structured information hierarchy
6. Cross-references and linking between related concepts
7. Installation and setup instructions
8. Troubleshooting guides and FAQ sections
9. Contribution guidelines and development workflows
10. Accessible language for different technical skill levels

Always ensure documentation is accurate, up-to-date, and follows industry best practices.`;

    super('Documentation', systemPrompt, options);
    this.documentationResults = [];
  }

  /**
   * Generate comprehensive project documentation
   */
  async generateProjectDocumentation(projectPath) {
    console.log(chalk.blue('📝 Generating comprehensive project documentation...'));

    const projectContext = await this.buildProjectContext(projectPath);
    
    const docPrompt = `Generate comprehensive documentation for this project:

PROJECT INFORMATION:
${projectContext.projectInfo}

CODE STRUCTURE:
${projectContext.codeStructure}

API ENDPOINTS:
${projectContext.apiEndpoints}

DEPENDENCIES:
${projectContext.dependencies}

Please create:
1. Main README.md with project overview, installation, and usage
2. API documentation with endpoints, parameters, and examples
3. Code documentation standards and inline comment guidelines
4. Contributing guidelines and development setup
5. Architecture overview and system design documentation
6. Deployment and configuration guides
7. Troubleshooting and FAQ section
8. Changelog and version history template

Format all documentation in proper Markdown with clear sections and examples.`;

    const result = await this.sendPrompt(docPrompt);
    
    this.documentationResults.push({
      type: 'project_documentation',
      timestamp: new Date().toISOString(),
      projectPath,
      result
    });

    return result;
  }

  /**
   * Generate API documentation
   */
  async generateAPIDocumentation(apiEndpoints, projectInfo = {}) {
    const apiPrompt = `Generate comprehensive API documentation for these endpoints:

PROJECT: ${projectInfo.name || 'API Project'}
VERSION: ${projectInfo.version || '1.0.0'}
BASE URL: ${projectInfo.baseUrl || 'https://api.example.com'}

ENDPOINTS:
${apiEndpoints.map((endpoint, index) => `
ENDPOINT ${index + 1}:
Method: ${endpoint.method || 'GET'}
Path: ${endpoint.path}
Description: ${endpoint.description || 'No description'}
Parameters: ${JSON.stringify(endpoint.parameters || {}, null, 2)}
Response: ${JSON.stringify(endpoint.response || {}, null, 2)}
Code:
\`\`\`javascript
${endpoint.code || 'No implementation provided'}
\`\`\`
`).join('\n')}

Create comprehensive API documentation including:
1. OpenAPI/Swagger specification
2. Endpoint descriptions with examples
3. Request/response schemas
4. Authentication and authorization details
5. Error codes and handling
6. Rate limiting information
7. SDK/client library examples
8. Interactive API explorer setup
9. Postman collection configuration
10. Testing guidelines

Use proper Markdown formatting and include working code examples.`;

    const result = await this.sendPrompt(apiPrompt);
    
    this.documentationResults.push({
      type: 'api_documentation',
      timestamp: new Date().toISOString(),
      endpoints: apiEndpoints,
      projectInfo,
      result
    });

    return result;
  }

  /**
   * Generate README.md file
   */
  async generateReadme(projectPath, projectInfo = {}) {
    const readmePrompt = `Create a comprehensive README.md file for this project:

PROJECT PATH: ${projectPath}
PROJECT INFO: ${JSON.stringify(projectInfo, null, 2)}

The README should include:
1. Project title and description
2. Features and capabilities
3. Installation instructions
4. Quick start guide with examples
5. Configuration options
6. Usage examples and tutorials
7. API reference (if applicable)
8. Contributing guidelines
9. License information
10. Support and contact information
11. Badges for build status, version, etc.
12. Screenshots or demo links (placeholders)

Use proper Markdown formatting with:
- Clear headings and sections
- Code blocks with syntax highlighting
- Tables for configuration options
- Links to additional documentation
- Emoji and formatting for better readability

Make it professional, comprehensive, and user-friendly.`;

    const result = await this.sendPrompt(readmePrompt);
    
    this.documentationResults.push({
      type: 'readme_generation',
      timestamp: new Date().toISOString(),
      projectPath,
      projectInfo,
      result
    });

    return result;
  }

  /**
   * Generate code documentation and comments
   */
  async generateCodeDocumentation(codeFiles) {
    const results = [];
    
    for (const file of codeFiles) {
      const docPrompt = `Generate comprehensive code documentation for this file:

FILE: ${file.path}
LANGUAGE: ${file.language || 'javascript'}
CONTENT:
\`\`\`${file.language || 'javascript'}
${file.content}
\`\`\`

Please provide:
1. File-level documentation header
2. Function/method documentation with parameters and return values
3. Class documentation with properties and methods
4. Inline comments for complex logic
5. Type definitions and interfaces (if applicable)
6. Usage examples for public APIs
7. JSDoc/equivalent format for the language
8. Error handling documentation
9. Performance considerations notes
10. Dependencies and requirements

Follow language-specific documentation standards (JSDoc for JavaScript, docstrings for Python, etc.).`;

      const result = await this.sendPrompt(docPrompt);
      results.push({
        file: file.path,
        documentation: result
      });
    }

    this.documentationResults.push({
      type: 'code_documentation',
      timestamp: new Date().toISOString(),
      files: codeFiles.map(f => f.path),
      results
    });

    return results;
  }

  /**
   * Generate user guide and tutorials
   */
  async generateUserGuide(projectPath, features = []) {
    const guidePrompt = `Create a comprehensive user guide and tutorial for this project:

PROJECT PATH: ${projectPath}
FEATURES: ${features.join(', ')}

Create documentation that includes:
1. Getting Started tutorial
2. Feature-by-feature guides
3. Common use cases and workflows
4. Best practices and tips
5. Troubleshooting guide
6. FAQ section
7. Advanced usage scenarios
8. Integration examples
9. Performance optimization tips
10. Migration guides (if applicable)

Structure the guide with:
- Clear step-by-step instructions
- Code examples and screenshots (placeholders)
- Prerequisites and requirements
- Expected outcomes for each step
- Links to related documentation
- Difficulty levels (Beginner, Intermediate, Advanced)

Make it beginner-friendly while providing depth for advanced users.`;

    const result = await this.sendPrompt(guidePrompt);
    
    this.documentationResults.push({
      type: 'user_guide',
      timestamp: new Date().toISOString(),
      projectPath,
      features,
      result
    });

    return result;
  }

  /**
   * Generate architecture documentation
   */
  async generateArchitectureDocumentation(projectPath, systemComponents = []) {
    const archPrompt = `Create comprehensive architecture documentation for this system:

PROJECT PATH: ${projectPath}
SYSTEM COMPONENTS: ${systemComponents.join(', ')}

Generate architecture documentation including:
1. System overview and high-level architecture
2. Component diagrams and relationships
3. Data flow diagrams
4. Database schema and relationships
5. API architecture and service boundaries
6. Security architecture and authentication flows
7. Deployment architecture and infrastructure
8. Scalability considerations and patterns
9. Technology stack and dependencies
10. Design patterns and architectural decisions
11. Performance characteristics and bottlenecks
12. Monitoring and observability setup

Use diagrams (describe them in text format) and include:
- Architectural principles and guidelines
- Decision records and rationale
- Trade-offs and alternatives considered
- Future architectural roadmap
- Integration patterns and protocols
- Error handling and fault tolerance

Make it comprehensive for both technical and non-technical stakeholders.`;

    const result = await this.sendPrompt(archPrompt);
    
    this.documentationResults.push({
      type: 'architecture_documentation',
      timestamp: new Date().toISOString(),
      projectPath,
      components: systemComponents,
      result
    });

    return result;
  }

  /**
   * Generate contributing guidelines
   */
  async generateContributingGuide(projectPath, projectInfo = {}) {
    const contributingPrompt = `Create comprehensive contributing guidelines for this project:

PROJECT PATH: ${projectPath}
PROJECT INFO: ${JSON.stringify(projectInfo, null, 2)}

Generate CONTRIBUTING.md that includes:
1. Welcome message and project mission
2. Code of conduct and community guidelines
3. Getting started for contributors
4. Development environment setup
5. Coding standards and style guides
6. Testing requirements and guidelines
7. Pull request process and templates
8. Issue reporting guidelines
9. Documentation contribution guidelines
10. Release process and versioning
11. Recognition and attribution
12. Communication channels and community

Include:
- Step-by-step setup instructions
- Code review process
- Git workflow and branching strategy
- Testing and quality assurance requirements
- Documentation standards
- Performance and security considerations
- Accessibility guidelines
- Internationalization requirements (if applicable)

Make it welcoming and comprehensive for new contributors.`;

    const result = await this.sendPrompt(contributingPrompt);
    
    this.documentationResults.push({
      type: 'contributing_guide',
      timestamp: new Date().toISOString(),
      projectPath,
      projectInfo,
      result
    });

    return result;
  }

  /**
   * Generate changelog template and guidelines
   */
  async generateChangelogGuide(projectPath) {
    const changelogPrompt = `Create a changelog template and guidelines for this project:

PROJECT PATH: ${projectPath}

Generate:
1. CHANGELOG.md template following Keep a Changelog format
2. Version numbering guidelines (semantic versioning)
3. Change categorization standards
4. Release note templates
5. Breaking change documentation process
6. Migration guide templates
7. Automated changelog generation setup
8. Review and approval process

Include:
- Format standards and examples
- Automation recommendations
- Integration with CI/CD pipeline
- Version tagging strategy
- Release announcement templates
- Backward compatibility guidelines
- Deprecation notice processes

Make it maintainable and automated where possible.`;

    const result = await this.sendPrompt(changelogPrompt);
    
    this.documentationResults.push({
      type: 'changelog_guide',
      timestamp: new Date().toISOString(),
      projectPath,
      result
    });

    return result;
  }

  /**
   * Write documentation files to project
   */
  async writeDocumentationFiles(projectPath, documentationType, content) {
    const docsDir = path.join(projectPath, 'docs');
    await fs.ensureDir(docsDir);

    const fileMap = {
      'readme': 'README.md',
      'api': 'API.md',
      'architecture': 'ARCHITECTURE.md',
      'contributing': 'CONTRIBUTING.md',
      'changelog': 'CHANGELOG.md',
      'user_guide': 'USER_GUIDE.md'
    };

    const filename = fileMap[documentationType] || `${documentationType.toUpperCase()}.md`;
    const filepath = path.join(projectPath, filename);

    await fs.writeFile(filepath, content, 'utf8');
    console.log(chalk.green(`📄 Generated ${filename} at ${filepath}`));
    
    return filepath;
  }

  /**
   * Get all documentation results
   */
  getDocumentationResults() {
    return this.documentationResults;
  }

  /**
   * Generate documentation report
   */
  async generateReport(projectPath) {
    const reportData = {
      agentType: this.agentType,
      projectPath,
      timestamp: new Date().toISOString(),
      documentationResults: this.documentationResults,
      conversationHistory: this.getConversationHistory(),
      summary: this.generateSummary()
    };

    const reportsDir = path.join(projectPath, '.claude', 'agents', 'reports');
    await fs.ensureDir(reportsDir);
    
    const reportFile = path.join(reportsDir, `documentation-${this.sessionId}.json`);
    await fs.writeJSON(reportFile, reportData, { spaces: 2 });

    console.log(chalk.green(`📊 Documentation report generated: ${reportFile}`));
    return reportFile;
  }

  /**
   * Build project context for documentation generation
   */
  async buildProjectContext(projectPath) {
    const projectInfo = await this.analyzeProjectInfo(projectPath);
    const codeStructure = await this.analyzeCodeStructure(projectPath);
    const apiEndpoints = await this.analyzeAPIEndpoints(projectPath);
    const dependencies = await this.analyzeDependencies(projectPath);

    return {
      projectInfo,
      codeStructure,
      apiEndpoints,
      dependencies
    };
  }

  /**
   * Analyze project information
   */
  async analyzeProjectInfo(projectPath) {
    const packageFiles = ['package.json', 'pyproject.toml', 'Cargo.toml', 'go.mod'];
    
    for (const file of packageFiles) {
      const filePath = path.join(projectPath, file);
      if (await fs.pathExists(filePath)) {
        const content = await fs.readFile(filePath, 'utf8');
        return { file, content };
      }
    }
    
    return { projectName: path.basename(projectPath) };
  }

  /**
   * Analyze code structure
   */
  async analyzeCodeStructure(projectPath) {
    const structure = [];
    const importantDirs = ['src', 'lib', 'app', 'api', 'components', 'services'];
    
    for (const dir of importantDirs) {
      const dirPath = path.join(projectPath, dir);
      if (await fs.pathExists(dirPath)) {
        const files = await fs.readdir(dirPath);
        structure.push(`${dir}/: ${files.length} files`);
      }
    }
    
    return structure.join('\n');
  }

  /**
   * Analyze API endpoints
   */
  async analyzeAPIEndpoints(projectPath) {
    // This would analyze route files to extract API endpoints
    // For now, return a placeholder
    return 'API endpoints analysis would be performed here';
  }

  /**
   * Analyze dependencies
   */
  async analyzeDependencies(projectPath) {
    const deps = [];
    const depFiles = ['package.json', 'requirements.txt', 'Cargo.toml', 'go.mod'];
    
    for (const file of depFiles) {
      const filePath = path.join(projectPath, file);
      if (await fs.pathExists(filePath)) {
        const content = await fs.readFile(filePath, 'utf8');
        deps.push({ file, content: content.slice(0, 500) });
      }
    }
    
    return deps;
  }

  /**
   * Generate summary of documentation results
   */
  generateSummary() {
    const totalDocs = this.documentationResults.length;
    const docTypes = [...new Set(this.documentationResults.map(r => r.type))];
    
    return `Documentation generation completed with ${totalDocs} documents across ${docTypes.length} categories: ${docTypes.join(', ')}.`;
  }
}

module.exports = DocumentationAgent;