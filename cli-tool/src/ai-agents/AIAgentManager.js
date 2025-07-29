const CodeReviewAgent = require('./CodeReviewAgent');
const CodeOptimizationAgent = require('./CodeOptimizationAgent');
const DocumentationAgent = require('./DocumentationAgent');
const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const ora = require('ora');

/**
 * AI Agent Manager - Coordinates and manages all specialized AI agents
 */
class AIAgentManager {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.agents = new Map();
    this.activeAgents = new Set();
    this.sessionId = this.generateSessionId();
  }

  /**
   * Initialize all available agents
   */
  async initializeAgents() {
    const spinner = ora('Initializing AI Agent ecosystem...').start();
    
    try {
      // Initialize Code Review Agent
      const codeReviewAgent = new CodeReviewAgent();
      await codeReviewAgent.initialize();
      this.agents.set('codeReview', codeReviewAgent);
      
      // Initialize Code Optimization Agent
      const optimizationAgent = new CodeOptimizationAgent();
      await optimizationAgent.initialize();
      this.agents.set('optimization', optimizationAgent);
      
      // Initialize Documentation Agent
      const documentationAgent = new DocumentationAgent();
      await documentationAgent.initialize();
      this.agents.set('documentation', documentationAgent);

      spinner.succeed('AI Agent ecosystem initialized successfully');
      
      console.log(chalk.green('\n🤖 Available AI Agents:'));
      console.log(chalk.blue('  📋 Code Review Agent - Security, best practices, and architecture analysis'));
      console.log(chalk.yellow('  ⚡ Code Optimization Agent - Performance analysis and optimization'));
      console.log(chalk.cyan('  📝 Documentation Agent - Comprehensive technical documentation'));
      
      return true;
    } catch (error) {
      spinner.fail('Failed to initialize AI Agent ecosystem');
      console.error(chalk.red('Error:'), error.message);
      return false;
    }
  }

  /**
   * Get specific agent by type
   */
  getAgent(agentType) {
    return this.agents.get(agentType);
  }

  /**
   * Run code review analysis
   */
  async runCodeReview(options = {}) {
    const agent = this.getAgent('codeReview');
    if (!agent) {
      throw new Error('Code Review Agent not initialized');
    }

    this.activeAgents.add('codeReview');
    
    try {
      console.log(chalk.blue('\n🔍 Starting Code Review Analysis...'));
      
      let results = {};
      
      // Project-wide review
      if (options.projectReview !== false) {
        console.log(chalk.gray('Analyzing entire project...'));
        results.projectReview = await agent.reviewProject(this.projectPath);
      }
      
      // Security analysis
      if (options.securityAnalysis) {
        console.log(chalk.gray('Conducting security analysis...'));
        results.securityAnalysis = await agent.securityAnalysis(this.projectPath);
      }
      
      // Specific files review
      if (options.files && options.files.length > 0) {
        console.log(chalk.gray(`Reviewing ${options.files.length} specific files...`));
        results.fileReviews = await agent.reviewFiles(options.files, this.projectPath);
      }
      
      // Generate report
      const reportPath = await agent.generateReport(this.projectPath);
      results.reportPath = reportPath;
      
      console.log(chalk.green('✅ Code Review Analysis completed'));
      return results;
      
    } finally {
      this.activeAgents.delete('codeReview');
    }
  }

  /**
   * Run code optimization analysis
   */
  async runCodeOptimization(options = {}) {
    const agent = this.getAgent('optimization');
    if (!agent) {
      throw new Error('Code Optimization Agent not initialized');
    }

    this.activeAgents.add('optimization');
    
    try {
      console.log(chalk.yellow('\n⚡ Starting Code Optimization Analysis...'));
      
      let results = {};
      
      // Project-wide analysis
      if (options.projectAnalysis !== false) {
        console.log(chalk.gray('Analyzing project for optimization opportunities...'));
        results.projectAnalysis = await agent.analyzeProject(this.projectPath);
      }
      
      // Frontend performance analysis
      if (options.frontendAnalysis) {
        console.log(chalk.gray('Analyzing frontend performance...'));
        results.frontendAnalysis = await agent.analyzeFrontendPerformance(this.projectPath);
      }
      
      // API performance analysis
      if (options.apiEndpoints && options.apiEndpoints.length > 0) {
        console.log(chalk.gray('Analyzing API performance...'));
        results.apiAnalysis = await agent.analyzeAPIPerformance(options.apiEndpoints);
      }
      
      // Database optimization
      if (options.dbQueries && options.dbQueries.length > 0) {
        console.log(chalk.gray('Analyzing database performance...'));
        results.dbAnalysis = await agent.analyzeDatabasePerformance(options.dbQueries, options.schema);
      }
      
      // Code block analysis
      if (options.codeBlocks && options.codeBlocks.length > 0) {
        console.log(chalk.gray('Analyzing specific code blocks...'));
        results.codeBlockAnalysis = await agent.analyzeCodeBlocks(options.codeBlocks);
      }
      
      // Generate optimization strategy
      if (options.strategy) {
        console.log(chalk.gray('Creating optimization strategy...'));
        results.strategy = await agent.generateOptimizationStrategy(
          this.projectPath, 
          options.projectType || 'web-application'
        );
      }
      
      // Generate report
      const reportPath = await agent.generateReport(this.projectPath);
      results.reportPath = reportPath;
      
      console.log(chalk.green('✅ Code Optimization Analysis completed'));
      return results;
      
    } finally {
      this.activeAgents.delete('optimization');
    }
  }

  /**
   * Run documentation generation
   */
  async runDocumentationGeneration(options = {}) {
    const agent = this.getAgent('documentation');
    if (!agent) {
      throw new Error('Documentation Agent not initialized');
    }

    this.activeAgents.add('documentation');
    
    try {
      console.log(chalk.cyan('\n📝 Starting Documentation Generation...'));
      
      let results = {};
      
      // Project documentation
      if (options.projectDocumentation !== false) {
        console.log(chalk.gray('Generating comprehensive project documentation...'));
        results.projectDocumentation = await agent.generateProjectDocumentation(this.projectPath);
      }
      
      // README generation
      if (options.readme) {
        console.log(chalk.gray('Generating README.md...'));
        results.readme = await agent.generateReadme(this.projectPath, options.projectInfo);
        
        if (options.writeFiles) {
          await agent.writeDocumentationFiles(this.projectPath, 'readme', results.readme);
        }
      }
      
      // API documentation
      if (options.apiEndpoints && options.apiEndpoints.length > 0) {
        console.log(chalk.gray('Generating API documentation...'));
        results.apiDocumentation = await agent.generateAPIDocumentation(
          options.apiEndpoints, 
          options.projectInfo
        );
        
        if (options.writeFiles) {
          await agent.writeDocumentationFiles(this.projectPath, 'api', results.apiDocumentation);
        }
      }
      
      // Code documentation
      if (options.codeFiles && options.codeFiles.length > 0) {
        console.log(chalk.gray('Generating code documentation...'));
        results.codeDocumentation = await agent.generateCodeDocumentation(options.codeFiles);
      }
      
      // User guide
      if (options.userGuide) {
        console.log(chalk.gray('Generating user guide...'));
        results.userGuide = await agent.generateUserGuide(
          this.projectPath, 
          options.features || []
        );
        
        if (options.writeFiles) {
          await agent.writeDocumentationFiles(this.projectPath, 'user_guide', results.userGuide);
        }
      }
      
      // Architecture documentation
      if (options.architecture) {
        console.log(chalk.gray('Generating architecture documentation...'));
        results.architecture = await agent.generateArchitectureDocumentation(
          this.projectPath, 
          options.systemComponents || []
        );
        
        if (options.writeFiles) {
          await agent.writeDocumentationFiles(this.projectPath, 'architecture', results.architecture);
        }
      }
      
      // Contributing guide
      if (options.contributing) {
        console.log(chalk.gray('Generating contributing guidelines...'));
        results.contributing = await agent.generateContributingGuide(
          this.projectPath, 
          options.projectInfo
        );
        
        if (options.writeFiles) {
          await agent.writeDocumentationFiles(this.projectPath, 'contributing', results.contributing);
        }
      }
      
      // Changelog guide
      if (options.changelog) {
        console.log(chalk.gray('Generating changelog template...'));
        results.changelog = await agent.generateChangelogGuide(this.projectPath);
        
        if (options.writeFiles) {
          await agent.writeDocumentationFiles(this.projectPath, 'changelog', results.changelog);
        }
      }
      
      // Generate report
      const reportPath = await agent.generateReport(this.projectPath);
      results.reportPath = reportPath;
      
      console.log(chalk.green('✅ Documentation Generation completed'));
      return results;
      
    } finally {
      this.activeAgents.delete('documentation');
    }
  }

  /**
   * Run comprehensive analysis with all agents
   */
  async runComprehensiveAnalysis(options = {}) {
    console.log(chalk.magenta('\n🚀 Starting Comprehensive AI Analysis...'));
    console.log(chalk.gray('This will run all available agents for complete project analysis.\n'));
    
    const results = {};
    
    try {
      // Code Review Analysis
      if (options.codeReview !== false) {
        results.codeReview = await this.runCodeReview({
          projectReview: true,
          securityAnalysis: true,
          ...options.codeReviewOptions
        });
      }
      
      // Code Optimization Analysis
      if (options.optimization !== false) {
        results.optimization = await this.runCodeOptimization({
          projectAnalysis: true,
          frontendAnalysis: true,
          strategy: true,
          ...options.optimizationOptions
        });
      }
      
      // Documentation Generation
      if (options.documentation !== false) {
        results.documentation = await this.runDocumentationGeneration({
          projectDocumentation: true,
          readme: true,
          architecture: true,
          contributing: true,
          writeFiles: options.writeFiles || false,
          ...options.documentationOptions
        });
      }
      
      // Generate comprehensive report
      const comprehensiveReport = await this.generateComprehensiveReport(results);
      results.comprehensiveReport = comprehensiveReport;
      
      console.log(chalk.green('\n🎉 Comprehensive AI Analysis completed successfully!'));
      console.log(chalk.blue(`📊 Comprehensive report: ${comprehensiveReport}`));
      
      return results;
      
    } catch (error) {
      console.error(chalk.red('\n❌ Comprehensive analysis failed:'), error.message);
      throw error;
    }
  }

  /**
   * Generate comprehensive report combining all agent results
   */
  async generateComprehensiveReport(analysisResults) {
    const reportsDir = path.join(this.projectPath, '.claude', 'agents', 'reports');
    await fs.ensureDir(reportsDir);
    
    const reportData = {
      sessionId: this.sessionId,
      projectPath: this.projectPath,
      timestamp: new Date().toISOString(),
      analysisResults,
      agentStatuses: this.getAgentStatuses(),
      summary: this.generateComprehensiveSummary(analysisResults)
    };
    
    const reportFile = path.join(reportsDir, `comprehensive-analysis-${this.sessionId}.json`);
    await fs.writeJSON(reportFile, reportData, { spaces: 2 });
    
    // Also generate a readable markdown report
    const markdownReport = this.generateMarkdownReport(reportData);
    const markdownFile = path.join(reportsDir, `comprehensive-analysis-${this.sessionId}.md`);
    await fs.writeFile(markdownFile, markdownReport, 'utf8');
    
    console.log(chalk.green(`📋 Comprehensive report: ${reportFile}`));
    console.log(chalk.green(`📋 Markdown report: ${markdownFile}`));
    
    return reportFile;
  }

  /**
   * Generate markdown report for easy reading
   */
  generateMarkdownReport(reportData) {
    const { analysisResults, summary, timestamp, projectPath } = reportData;
    
    let markdown = `# Comprehensive AI Analysis Report

**Project**: ${path.basename(projectPath)}
**Generated**: ${new Date(timestamp).toLocaleString()}
**Session ID**: ${reportData.sessionId}

## Executive Summary

${summary}

## Analysis Results

`;

    if (analysisResults.codeReview) {
      markdown += `### 🔍 Code Review Analysis
- Report: ${analysisResults.codeReview.reportPath}
- Status: ✅ Completed

`;
    }

    if (analysisResults.optimization) {
      markdown += `### ⚡ Code Optimization Analysis
- Report: ${analysisResults.optimization.reportPath}
- Status: ✅ Completed

`;
    }

    if (analysisResults.documentation) {
      markdown += `### 📝 Documentation Generation
- Report: ${analysisResults.documentation.reportPath}
- Status: ✅ Completed

`;
    }

    markdown += `## Agent Status

${Object.entries(this.getAgentStatuses()).map(([agentType, status]) => 
  `- **${agentType}**: ${status.initialized ? '✅ Ready' : '❌ Not Ready'} (${status.conversationCount} conversations)`
).join('\n')}

## Next Steps

1. Review individual agent reports for detailed findings
2. Implement recommended security fixes and optimizations
3. Use generated documentation and update as needed
4. Schedule regular analysis runs for continuous improvement

---
*Generated by Claude Code AI Agent Ecosystem*
`;

    return markdown;
  }

  /**
   * Get status of all agents
   */
  getAgentStatuses() {
    const statuses = {};
    
    for (const [agentType, agent] of this.agents) {
      statuses[agentType] = agent.getStatus();
    }
    
    return statuses;
  }

  /**
   * Generate comprehensive summary
   */
  generateComprehensiveSummary(analysisResults) {
    let summary = 'Comprehensive AI analysis completed. ';
    
    const completedAnalyses = Object.keys(analysisResults).length;
    summary += `${completedAnalyses} major analyses performed: `;
    
    const analyses = [];
    if (analysisResults.codeReview) analyses.push('Code Review');
    if (analysisResults.optimization) analyses.push('Performance Optimization');
    if (analysisResults.documentation) analyses.push('Documentation Generation');
    
    summary += analyses.join(', ') + '.';
    
    return summary;
  }

  /**
   * Cleanup all agents
   */
  async cleanup() {
    console.log(chalk.gray('\n🧹 Cleaning up AI Agent ecosystem...'));
    
    for (const [agentType, agent] of this.agents) {
      await agent.cleanup();
    }
    
    this.agents.clear();
    this.activeAgents.clear();
    
    console.log(chalk.gray('✅ AI Agent ecosystem cleaned up'));
  }

  /**
   * Save all agent conversations
   */
  async saveAllConversations() {
    const savedPaths = [];
    
    for (const [agentType, agent] of this.agents) {
      try {
        const path = await agent.saveConversation(this.projectPath);
        savedPaths.push({ agentType, path });
      } catch (error) {
        console.error(chalk.yellow(`⚠️  Failed to save ${agentType} conversation:`, error.message));
      }
    }
    
    return savedPaths;
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `ai-agents-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get active agents
   */
  getActiveAgents() {
    return Array.from(this.activeAgents);
  }

  /**
   * Check if any agents are currently active
   */
  hasActiveAgents() {
    return this.activeAgents.size > 0;
  }
}

module.exports = AIAgentManager;