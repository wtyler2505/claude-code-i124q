const ClaudeAgent = require('./ClaudeAgent');
const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');

/**
 * Code Review Agent - Specialized for security, best practices, and architecture analysis
 */
class CodeReviewAgent extends ClaudeAgent {
  constructor(options = {}) {
    const systemPrompt = `You are a senior code reviewer and security expert with extensive experience in:
- Code security vulnerabilities and best practices
- Software architecture and design patterns
- Performance optimization and code quality
- Multi-language expertise (JavaScript/TypeScript, Python, Go, Rust, Java, C++)
- OWASP security guidelines and secure coding practices
- Code maintainability and documentation standards

When reviewing code, provide:
1. Security vulnerability analysis with severity ratings
2. Best practice recommendations with specific examples
3. Architecture and design pattern suggestions
4. Performance improvement opportunities
5. Code maintainability and readability improvements
6. Specific, actionable recommendations with code examples

Be thorough, constructive, and provide clear explanations for all recommendations.`;

    super('CodeReview', systemPrompt, options);
    this.reviewResults = [];
  }

  /**
   * Review entire project codebase
   */
  async reviewProject(projectPath) {
    const files = await this.scanProjectFiles(projectPath);
    const spinner = chalk.blue('🔍 Analyzing project structure and files...');
    console.log(spinner);

    // Create comprehensive project context
    const projectContext = await this.buildProjectContext(projectPath, files);
    
    const reviewPrompt = `Please conduct a comprehensive code review of this project:

PROJECT STRUCTURE:
${projectContext.structure}

KEY FILES ANALYSIS:
${projectContext.keyFiles}

DEPENDENCIES:
${projectContext.dependencies}

Please provide:
1. Security vulnerability assessment
2. Architecture review and recommendations
3. Code quality analysis
4. Performance optimization opportunities
5. Best practice improvements
6. Maintainability assessment

Focus on critical issues first, then provide recommendations for improvements.`;

    const result = await this.sendPrompt(reviewPrompt);
    
    this.reviewResults.push({
      type: 'project_review',
      timestamp: new Date().toISOString(),
      projectPath,
      result
    });

    return result;
  }

  /**
   * Review specific files
   */
  async reviewFiles(filePaths, projectRoot) {
    const results = [];
    
    for (const filePath of filePaths) {
      const fullPath = path.resolve(projectRoot, filePath);
      const fileContent = await fs.readFile(fullPath, 'utf8');
      const fileExt = path.extname(filePath);
      
      const reviewPrompt = `Please review this ${fileExt} file for security, best practices, and code quality:

FILE: ${filePath}
CONTENT:
\`\`\`${fileExt.slice(1)}
${fileContent}
\`\`\`

Provide specific recommendations for:
1. Security vulnerabilities
2. Code quality improvements
3. Performance optimizations
4. Best practice adherence
5. Documentation and readability`;

      const result = await this.sendPrompt(reviewPrompt);
      results.push({
        file: filePath,
        review: result
      });
    }

    this.reviewResults.push({
      type: 'file_review',
      timestamp: new Date().toISOString(),
      files: filePaths,
      results
    });

    return results;
  }

  /**
   * Security-focused analysis
   */
  async securityAnalysis(projectPath) {
    const securityPrompt = `Conduct a comprehensive security analysis of this project focusing on:

1. Input validation and sanitization
2. Authentication and authorization flaws
3. SQL injection and XSS vulnerabilities
4. Insecure dependencies and packages
5. Secrets and credential management
6. API security best practices
7. Data protection and privacy compliance

Please provide a detailed security report with:
- Vulnerability severity ratings (Critical, High, Medium, Low)
- Specific vulnerable code locations
- Remediation recommendations with code examples
- Security best practices for this project type`;

    const result = await this.sendPrompt(securityPrompt);
    
    this.reviewResults.push({
      type: 'security_analysis',
      timestamp: new Date().toISOString(),
      projectPath,
      result
    });

    return result;
  }

  /**
   * Get all review results
   */
  getReviewResults() {
    return this.reviewResults;
  }

  /**
   * Generate review report
   */
  async generateReport(projectPath) {
    const reportData = {
      agentType: this.agentType,
      projectPath,
      timestamp: new Date().toISOString(),
      reviewResults: this.reviewResults,
      conversationHistory: this.getConversationHistory(),
      summary: this.generateSummary()
    };

    const reportsDir = path.join(projectPath, '.claude', 'agents', 'reports');
    await fs.ensureDir(reportsDir);
    
    const reportFile = path.join(reportsDir, `code-review-${this.sessionId}.json`);
    await fs.writeJSON(reportFile, reportData, { spaces: 2 });

    console.log(chalk.green(`📊 Code review report generated: ${reportFile}`));
    return reportFile;
  }

  /**
   * Build project context for analysis
   */
  async buildProjectContext(projectPath, files) {
    const structure = await this.getProjectStructure(projectPath);
    const keyFiles = await this.analyzeKeyFiles(files);
    const dependencies = await this.analyzeDependencies(projectPath);

    return {
      structure,
      keyFiles,
      dependencies
    };
  }

  /**
   * Scan project files
   */
  async scanProjectFiles(projectPath) {
    const files = [];
    const extensions = ['.js', '.ts', '.tsx', '.jsx', '.py', '.go', '.rs', '.java', '.cpp', '.c', '.h'];
    
    async function scanDir(dir) {
      const items = await fs.readdir(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = await fs.stat(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          await scanDir(fullPath);
        } else if (stat.isFile() && extensions.includes(path.extname(item))) {
          files.push(path.relative(projectPath, fullPath));
        }
      }
    }

    await scanDir(projectPath);
    return files;
  }

  /**
   * Get project structure overview
   */
  async getProjectStructure(projectPath) {
    // Implementation for getting project structure
    return 'Project structure analysis';
  }

  /**
   * Analyze key files
   */
  async analyzeKeyFiles(files) {
    // Focus on configuration files, main entry points, etc.
    const keyFiles = files.filter(file => 
      file.includes('package.json') || 
      file.includes('requirements.txt') ||
      file.includes('Cargo.toml') ||
      file.includes('go.mod') ||
      file.includes('main.') ||
      file.includes('index.') ||
      file.includes('app.') ||
      file.includes('server.')
    );
    
    return keyFiles.slice(0, 10); // Limit to top 10 key files
  }

  /**
   * Analyze dependencies
   */
  async analyzeDependencies(projectPath) {
    const deps = [];
    
    // Check for various dependency files
    const depFiles = ['package.json', 'requirements.txt', 'Cargo.toml', 'go.mod'];
    
    for (const file of depFiles) {
      const filePath = path.join(projectPath, file);
      if (await fs.pathExists(filePath)) {
        const content = await fs.readFile(filePath, 'utf8');
        deps.push({ file, content: content.slice(0, 1000) }); // Limit content size
      }
    }
    
    return deps;
  }

  /**
   * Generate summary of review results
   */
  generateSummary() {
    return `Code review completed with ${this.reviewResults.length} analyses performed.`;
  }
}

module.exports = CodeReviewAgent;