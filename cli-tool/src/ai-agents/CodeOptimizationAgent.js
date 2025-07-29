const ClaudeAgent = require('./ClaudeAgent');
const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');

/**
 * Code Optimization Agent - Specialized for performance analysis and optimization
 */
class CodeOptimizationAgent extends ClaudeAgent {
  constructor(options = {}) {
    const systemPrompt = `You are a performance optimization expert and software architect with deep expertise in:
- Performance profiling and bottleneck identification
- Algorithmic complexity analysis and optimization
- Memory management and resource optimization
- Database query optimization and indexing strategies
- Caching strategies and implementation patterns  
- Concurrent programming and parallelization
- System architecture scalability improvements
- Language-specific performance best practices (JavaScript/Node.js, Python, Go, Rust, Java)
- Frontend performance optimization (bundle size, lazy loading, rendering)
- Backend optimization (API performance, database connections, microservices)

When analyzing code for optimization, provide:
1. Performance bottleneck identification with specific metrics
2. Algorithmic complexity analysis (Big O notation)
3. Memory usage optimization recommendations
4. Database and query optimization suggestions
5. Caching strategy recommendations
6. Architecture improvements for scalability
7. Specific code refactoring examples with before/after comparisons
8. Performance monitoring and measurement strategies

Be specific, provide measurable improvements, and include implementation details.`;

    super('CodeOptimization', systemPrompt, options);
    this.optimizationResults = [];
  }

  /**
   * Analyze entire project for performance optimization opportunities
   */
  async analyzeProject(projectPath) {
    const files = await this.scanProjectFiles(projectPath);
    console.log(chalk.blue('⚡ Analyzing project for performance optimization opportunities...'));

    const projectContext = await this.buildProjectContext(projectPath, files);
    
    const analysisPrompt = `Please conduct a comprehensive performance analysis of this project:

PROJECT STRUCTURE:
${projectContext.structure}

KEY PERFORMANCE-CRITICAL FILES:
${projectContext.keyFiles}

DEPENDENCIES AND ARCHITECTURE:
${projectContext.dependencies}

Please analyze and provide recommendations for:
1. Performance bottlenecks in critical code paths
2. Algorithmic complexity improvements
3. Memory usage optimization
4. Database query optimization
5. Caching strategy implementation
6. Bundle size and loading optimization (if applicable)
7. API performance improvements
8. Scalability enhancements

Prioritize recommendations by potential performance impact and implementation effort.`;

    const result = await this.sendPrompt(analysisPrompt);
    
    this.optimizationResults.push({
      type: 'project_analysis',
      timestamp: new Date().toISOString(),
      projectPath,
      result
    });

    return result;
  }

  /**
   * Analyze specific functions or code blocks for optimization
   */
  async analyzeCodeBlocks(codeBlocks, context = {}) {
    const results = [];
    
    for (const block of codeBlocks) {
      const analysisPrompt = `Analyze this code block for performance optimization:

LANGUAGE: ${block.language || 'javascript'}
FILE: ${block.filePath || 'unknown'}
CONTEXT: ${context.description || 'General optimization'}

CODE:
\`\`\`${block.language || 'javascript'}
${block.code}
\`\`\`

Please provide:
1. Current algorithmic complexity analysis
2. Performance bottlenecks identification
3. Memory usage analysis
4. Optimization recommendations with code examples
5. Expected performance improvements (quantitative if possible)
6. Alternative algorithms or data structures
7. Profiling suggestions for measuring improvements`;

      const result = await this.sendPrompt(analysisPrompt);
      results.push({
        originalCode: block.code,
        filePath: block.filePath,
        analysis: result
      });
    }

    this.optimizationResults.push({
      type: 'code_block_analysis',
      timestamp: new Date().toISOString(),
      context,
      results
    });

    return results;
  }

  /**
   * Database optimization analysis
   */
  async analyzeDatabasePerformance(dbQueries, schemaInfo = null) {
    const dbPrompt = `Analyze these database queries and schema for optimization:

${schemaInfo ? `SCHEMA INFORMATION:\n${schemaInfo}\n` : ''}

QUERIES TO ANALYZE:
${dbQueries.map((query, index) => `
QUERY ${index + 1}:
File: ${query.filePath || 'unknown'}
Type: ${query.type || 'unknown'}
Query:
\`\`\`sql
${query.sql}
\`\`\`
Context: ${query.context || 'No context provided'}
`).join('\n')}

Please provide optimization recommendations for:
1. Query performance improvements
2. Indexing strategy recommendations
3. Schema optimization suggestions
4. Connection pooling and caching strategies
5. Query rewriting for better performance
6. N+1 query problem identification and solutions
7. Database-specific optimization techniques

Include specific SQL examples and expected performance improvements.`;

    const result = await this.sendPrompt(dbPrompt);
    
    this.optimizationResults.push({
      type: 'database_analysis',
      timestamp: new Date().toISOString(),
      queries: dbQueries,
      schema: schemaInfo,
      result
    });

    return result;
  }

  /**
   * Frontend performance optimization analysis
   */
  async analyzeFrontendPerformance(projectPath) {
    const frontendFiles = await this.scanFrontendFiles(projectPath);
    
    const frontendPrompt = `Analyze this frontend project for performance optimization:

FRONTEND FILES:
${frontendFiles.slice(0, 10).map(file => `- ${file}`).join('\n')}

Please analyze and recommend optimizations for:
1. Bundle size reduction strategies
2. Code splitting and lazy loading opportunities
3. Image and asset optimization
4. CSS and JavaScript optimization
5. Rendering performance improvements
6. Memory leak prevention
7. Network request optimization
8. Caching strategies
9. Core Web Vitals improvements (LCP, FID, CLS)
10. Progressive loading techniques

Provide specific implementations and expected performance improvements.`;

    const result = await this.sendPrompt(frontendPrompt);
    
    this.optimizationResults.push({
      type: 'frontend_analysis',
      timestamp: new Date().toISOString(),
      projectPath,
      result
    });

    return result;
  }

  /**
   * API performance optimization analysis
   */
  async analyzeAPIPerformance(apiEndpoints) {
    const apiPrompt = `Analyze these API endpoints for performance optimization:

API ENDPOINTS:
${apiEndpoints.map((endpoint, index) => `
ENDPOINT ${index + 1}:
Method: ${endpoint.method || 'GET'}
Path: ${endpoint.path || 'unknown'}
File: ${endpoint.filePath || 'unknown'}
Handler Code:
\`\`\`javascript
${endpoint.code}
\`\`\`
Description: ${endpoint.description || 'No description'}
`).join('\n')}

Please provide optimization recommendations for:
1. Response time improvements
2. Database query optimization
3. Caching strategy implementation
4. Rate limiting and throttling
5. Payload size optimization
6. Connection pooling
7. Asynchronous processing opportunities
8. Error handling optimization
9. Monitoring and profiling setup
10. Scalability improvements

Include specific code examples and performance metrics.`;

    const result = await this.sendPrompt(apiPrompt);
    
    this.optimizationResults.push({
      type: 'api_analysis',
      timestamp: new Date().toISOString(),
      endpoints: apiEndpoints,
      result
    });

    return result;
  }

  /**
   * Generate optimization recommendations based on project type
   */
  async generateOptimizationStrategy(projectPath, projectType) {
    const strategyPrompt = `Create a comprehensive optimization strategy for this ${projectType} project:

PROJECT PATH: ${projectPath}
PROJECT TYPE: ${projectType}

Please create a prioritized optimization roadmap including:
1. Quick wins (low effort, high impact)
2. Medium-term improvements (moderate effort, significant impact)
3. Long-term architectural changes (high effort, transformative impact)
4. Performance monitoring setup
5. Optimization measurement strategies
6. Tools and techniques for ongoing optimization
7. Team training recommendations
8. Budget and timeline estimates

Focus on practical, implementable solutions with clear ROI.`;

    const result = await this.sendPrompt(strategyPrompt);
    
    this.optimizationResults.push({
      type: 'optimization_strategy',
      timestamp: new Date().toISOString(),
      projectPath,
      projectType,
      result
    });

    return result;
  }

  /**
   * Get all optimization results
   */
  getOptimizationResults() {
    return this.optimizationResults;
  }

  /**
   * Generate optimization report
   */
  async generateReport(projectPath) {
    const reportData = {
      agentType: this.agentType,
      projectPath,
      timestamp: new Date().toISOString(),
      optimizationResults: this.optimizationResults,
      conversationHistory: this.getConversationHistory(),
      summary: this.generateSummary()
    };

    const reportsDir = path.join(projectPath, '.claude', 'agents', 'reports');
    await fs.ensureDir(reportsDir);
    
    const reportFile = path.join(reportsDir, `optimization-${this.sessionId}.json`);
    await fs.writeJSON(reportFile, reportData, { spaces: 2 });

    console.log(chalk.green(`📊 Optimization report generated: ${reportFile}`));
    return reportFile;
  }

  /**
   * Scan project files focusing on performance-critical files
   */
  async scanProjectFiles(projectPath) {
    const files = [];
    const extensions = ['.js', '.ts', '.tsx', '.jsx', '.py', '.go', '.rs', '.java', '.cpp', '.c'];
    const criticalPatterns = ['server', 'api', 'database', 'query', 'cache', 'performance', 'optimize'];
    
    async function scanDir(dir) {
      const items = await fs.readdir(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = await fs.stat(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          await scanDir(fullPath);
        } else if (stat.isFile() && extensions.includes(path.extname(item))) {
          const relativePath = path.relative(projectPath, fullPath);
          const isCritical = criticalPatterns.some(pattern => 
            relativePath.toLowerCase().includes(pattern)
          );
          files.push({ path: relativePath, critical: isCritical });
        }
      }
    }

    await scanDir(projectPath);
    
    // Sort with critical files first
    return files.sort((a, b) => b.critical - a.critical);
  }

  /**
   * Scan frontend-specific files
   */
  async scanFrontendFiles(projectPath) {
    const frontendExtensions = ['.js', '.ts', '.tsx', '.jsx', '.css', '.scss', '.vue', '.svelte'];
    const frontendDirs = ['src', 'client', 'frontend', 'public', 'assets'];
    const files = [];

    for (const dir of frontendDirs) {
      const dirPath = path.join(projectPath, dir);
      if (await fs.pathExists(dirPath)) {
        const dirFiles = await this.scanDirectoryForFiles(dirPath, frontendExtensions);
        files.push(...dirFiles.map(f => path.relative(projectPath, f)));
      }
    }

    return files;
  }

  /**
   * Scan directory for specific file extensions
   */
  async scanDirectoryForFiles(dir, extensions) {
    const files = [];
    
    async function scan(currentDir) {
      const items = await fs.readdir(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = await fs.stat(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          await scan(fullPath);
        } else if (stat.isFile() && extensions.includes(path.extname(item))) {
          files.push(fullPath);
        }
      }
    }

    await scan(dir);
    return files;
  }

  /**
   * Build project context for optimization analysis
   */
  async buildProjectContext(projectPath, files) {
    const structure = `Performance-critical files identified: ${files.filter(f => f.critical).length}`;
    const keyFiles = files.filter(f => f.critical).slice(0, 15).map(f => f.path).join('\n');
    const dependencies = await this.analyzeDependencies(projectPath);

    return {
      structure,
      keyFiles,
      dependencies
    };
  }

  /**
   * Analyze dependencies for performance impact
   */
  async analyzeDependencies(projectPath) {
    const deps = [];
    const depFiles = ['package.json', 'requirements.txt', 'Cargo.toml', 'go.mod'];
    
    for (const file of depFiles) {
      const filePath = path.join(projectPath, file);
      if (await fs.pathExists(filePath)) {
        const content = await fs.readFile(filePath, 'utf8');
        deps.push({ file, content: content.slice(0, 1000) });
      }
    }
    
    return deps;
  }

  /**
   * Generate summary of optimization results
   */
  generateSummary() {
    const totalAnalyses = this.optimizationResults.length;
    const analysisTypes = [...new Set(this.optimizationResults.map(r => r.type))];
    
    return `Optimization analysis completed with ${totalAnalyses} analyses across ${analysisTypes.length} categories: ${analysisTypes.join(', ')}.`;
  }
}

module.exports = CodeOptimizationAgent;