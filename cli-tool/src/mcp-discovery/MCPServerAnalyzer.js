const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * MCP Server Analyzer - Analyzes and profiles MCP servers
 */
class MCPServerAnalyzer {
  constructor() {
    this.analysisCache = new Map();
  }

  /**
   * Analyze a single MCP server
   */
  async analyzeMCPServer(serverInfo) {
    const cacheKey = `${serverInfo.id}-${serverInfo.command}`;
    
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey);
    }

    const analysis = {
      id: serverInfo.id,
      name: serverInfo.name,
      originalInfo: serverInfo,
      
      // Basic Information
      category: this.categorizeServer(serverInfo),
      complexity: this.calculateComplexity(serverInfo),
      priority: this.calculatePriority(serverInfo),
      
      // Status Information
      isInstalled: await this.checkIfInstalled(serverInfo),
      isRunning: await this.checkIfRunning(serverInfo),
      isConfigured: this.checkIfConfigured(serverInfo),
      
      // Capability Analysis
      capabilities: await this.analyzeCapabilities(serverInfo),
      dependencies: await this.analyzeDependencies(serverInfo),
      resources: await this.analyzeResourceUsage(serverInfo),
      
      // Compatibility
      compatibility: this.analyzeCompatibility(serverInfo),
      conflicts: [],
      
      // Metadata
      lastUpdated: serverInfo.lastUpdated || null,
      version: serverInfo.version || 'unknown',
      maintainer: serverInfo.maintainer || 'unknown',
      
      // Health
      healthStatus: 'unknown',
      healthScore: 0,
      issues: [],
      recommendations: []
    };

    // Perform health check if server is installed
    if (analysis.isInstalled) {
      await this.performHealthCheck(analysis);
    }

    // Generate recommendations
    this.generateRecommendations(analysis);

    this.analysisCache.set(cacheKey, analysis);
    return analysis;
  }

  /**
   * Analyze multiple MCP servers
   */
  async analyzeMCPServers(servers) {
    console.log(chalk.blue('🔬 Analyzing MCP servers...'));
    
    const analyses = [];
    
    for (const server of servers) {
      try {
        const analysis = await this.analyzeMCPServer(server);
        analyses.push(analysis);
      } catch (error) {
        console.warn(chalk.yellow(`⚠️  Error analyzing ${server.name}:`), error.message);
        
        // Create minimal analysis for failed servers
        analyses.push({
          id: server.id,
          name: server.name,
          originalInfo: server,
          category: 'unknown',
          complexity: 1,
          priority: 'low',
          isInstalled: false,
          isRunning: false,
          isConfigured: false,
          healthStatus: 'error',
          healthScore: 0,
          issues: [`Analysis failed: ${error.message}`],
          recommendations: ['Manual investigation required']
        });
      }
    }

    // Perform cross-server analysis
    this.performCrossServerAnalysis(analyses);

    console.log(chalk.green(`✅ Analyzed ${analyses.length} MCP servers`));
    return analyses;
  }

  /**
   * Categorize MCP server based on its purpose
   */
  categorizeServer(serverInfo) {
    const name = (serverInfo.name || '').toLowerCase();
    const description = (serverInfo.description || '').toLowerCase();
    const command = (serverInfo.command || '').toLowerCase();

    // File system operations
    if (name.includes('filesystem') || name.includes('file') || 
        description.includes('file') || description.includes('directory')) {
      return 'filesystem';
    }

    // Database operations
    if (name.includes('database') || name.includes('db') || name.includes('sql') ||
        description.includes('database') || description.includes('query')) {
      return 'database';
    }

    // Web and API
    if (name.includes('web') || name.includes('http') || name.includes('api') ||
        name.includes('search') || description.includes('web') || description.includes('search')) {
      return 'web-api';
    }

    // Development tools
    if (name.includes('git') || name.includes('github') || name.includes('docker') ||
        description.includes('git') || description.includes('development')) {
      return 'development';
    }

    // AI and ML
    if (name.includes('ai') || name.includes('ml') || name.includes('model') ||
        name.includes('openai') || name.includes('anthropic') ||
        description.includes('ai') || description.includes('machine learning')) {
      return 'ai-ml';
    }

    // Memory and storage
    if (name.includes('memory') || name.includes('storage') || name.includes('cache') ||
        description.includes('memory') || description.includes('storage')) {
      return 'memory-storage';
    }

    // Communication
    if (name.includes('email') || name.includes('slack') || name.includes('discord') ||
        name.includes('notification') || description.includes('communication')) {
      return 'communication';
    }

    // Utilities
    if (name.includes('util') || name.includes('tool') || name.includes('helper')) {
      return 'utilities';
    }

    return 'other';
  }

  /**
   * Calculate complexity score for MCP server
   */
  calculateComplexity(serverInfo) {
    let complexity = 1; // Base complexity

    // Add complexity for configuration
    if (serverInfo.env && Object.keys(serverInfo.env).length > 0) {
      complexity += Math.min(Object.keys(serverInfo.env).length / 3, 2);
    }

    if (serverInfo.args && serverInfo.args.length > 0) {
      complexity += Math.min(serverInfo.args.length / 2, 1);
    }

    // Add complexity for dependencies
    if (serverInfo.dependencies && serverInfo.dependencies.length > 0) {
      complexity += Math.min(serverInfo.dependencies.length / 2, 1);
    }

    // Add complexity based on command
    const command = serverInfo.command || '';
    if (command.includes('&&') || command.includes('||') || command.includes('|')) {
      complexity += 1;
    }

    return Math.min(Math.round(complexity), 5);
  }

  /**
   * Calculate priority score for MCP server
   */
  calculatePriority(serverInfo) {
    let score = 0;

    // Category-based priority
    const categoryPriority = {
      'filesystem': 5,
      'memory-storage': 4,
      'development': 4,
      'web-api': 3,
      'database': 3,
      'ai-ml': 2,
      'communication': 2,
      'utilities': 1,
      'other': 1
    };

    const category = this.categorizeServer(serverInfo);
    score += categoryPriority[category] || 1;

    // Source-based priority
    if (serverInfo.source === 'project') score += 3;
    if (serverInfo.source === 'global') score += 2;
    if (serverInfo.source === 'curated') score += 2;

    // Status-based priority
    if (serverInfo.type === 'installed') score += 2;
    if (serverInfo.type === 'configured') score += 1;

    // Popularity-based priority
    if (serverInfo.popularity === 'high') score += 2;
    if (serverInfo.popularity === 'medium') score += 1;

    // Convert to priority level
    if (score >= 8) return 'critical';
    if (score >= 6) return 'high';
    if (score >= 4) return 'medium';
    if (score >= 2) return 'low';
    return 'minimal';
  }

  /**
   * Check if MCP server is installed
   */
  async checkIfInstalled(serverInfo) {
    try {
      const command = serverInfo.command || '';
      
      // Check if it's an npx command
      if (command.startsWith('npx ')) {
        const packageName = command.replace('npx ', '').split(' ')[0];
        try {
          await execAsync(`npm list -g ${packageName}`);
          return true;
        } catch (error) {
          return false;
        }
      }

      // Check if it's a direct command
      if (command.includes('node ') || command.includes('python ') || command.includes('bash ')) {
        const scriptPath = command.split(' ').pop();
        if (serverInfo.scriptPath) {
          return await fs.pathExists(serverInfo.scriptPath);
        }
        return false;
      }

      // Check if command exists in PATH
      try {
        await execAsync(`which ${command.split(' ')[0]}`);
        return true;
      } catch (error) {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if MCP server is currently running
   */
  async checkIfRunning(serverInfo) {
    try {
      // This is a simplified check - would need more sophisticated process detection
      const command = serverInfo.command || '';
      const processName = command.split(' ')[0];
      
      const { stdout } = await execAsync(`pgrep -f "${processName}"`);
      return stdout.trim().length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if MCP server is configured
   */
  checkIfConfigured(serverInfo) {
    return serverInfo.source === 'config-file' || 
           serverInfo.configPath || 
           serverInfo.type === 'configured';
  }

  /**
   * Analyze MCP server capabilities
   */
  async analyzeCapabilities(serverInfo) {
    const capabilities = {
      tools: [],
      resources: [],
      prompts: [],
      estimated: true // Since we can't actually query the server
    };

    // Infer capabilities from name and description
    const name = (serverInfo.name || '').toLowerCase();
    const description = (serverInfo.description || '').toLowerCase();

    // File system capabilities
    if (name.includes('filesystem') || description.includes('file')) {
      capabilities.tools.push('read_file', 'write_file', 'list_directory', 'create_directory');
      capabilities.resources.push('file://');
    }

    // Database capabilities
    if (name.includes('database') || description.includes('database')) {
      capabilities.tools.push('query_database', 'execute_sql', 'describe_table');
      capabilities.resources.push('database://');
    }

    // Web capabilities
    if (name.includes('web') || name.includes('search') || description.includes('web')) {
      capabilities.tools.push('web_search', 'fetch_url', 'scrape_page');
      capabilities.resources.push('http://', 'https://');
    }

    // Memory capabilities
    if (name.includes('memory') || description.includes('memory')) {
      capabilities.tools.push('store_memory', 'retrieve_memory', 'search_memory');
      capabilities.resources.push('memory://');
    }

    return capabilities;
  }

  /**
   * Analyze MCP server dependencies
   */
  async analyzeDependencies(serverInfo) {
    const dependencies = {
      system: [],
      runtime: [],
      packages: [],
      environment: []
    };

    const command = serverInfo.command || '';
    
    // Runtime dependencies
    if (command.includes('node') || command.includes('npx')) {
      dependencies.runtime.push('nodejs');
    }
    if (command.includes('python')) {
      dependencies.runtime.push('python');
    }
    if (command.includes('bash') || command.includes('sh')) {
      dependencies.runtime.push('bash');
    }

    // Environment variables
    if (serverInfo.env) {
      dependencies.environment = Object.keys(serverInfo.env);
    }

    // Package dependencies (would need to parse package files)
    if (serverInfo.packageJsonPath) {
      try {
        const packageJson = await fs.readJSON(serverInfo.packageJsonPath);
        dependencies.packages = Object.keys(packageJson.dependencies || {});
      } catch (error) {
        // Ignore parsing errors
      }
    }

    return dependencies;
  }

  /**
   * Analyze resource usage
   */
  async analyzeResourceUsage(serverInfo) {
    return {
      memoryUsage: 'unknown',
      cpuUsage: 'unknown',
      diskUsage: 'unknown',
      networkUsage: 'unknown',
      estimatedLoad: this.estimateLoad(serverInfo)
    };
  }

  /**
   * Estimate server load based on category and complexity
   */
  estimateLoad(serverInfo) {
    const category = this.categorizeServer(serverInfo);
    const complexity = this.calculateComplexity(serverInfo);

    const loadFactors = {
      'database': 3,
      'web-api': 2,
      'ai-ml': 4,
      'filesystem': 1,
      'memory-storage': 2,
      'development': 1,
      'communication': 2,
      'utilities': 1,
      'other': 1
    };

    const baseLoad = loadFactors[category] || 1;
    const adjustedLoad = baseLoad * (complexity / 3);

    if (adjustedLoad >= 4) return 'high';
    if (adjustedLoad >= 2.5) return 'medium';
    if (adjustedLoad >= 1.5) return 'low';
    return 'minimal';
  }

  /**
   * Analyze compatibility with current environment
   */
  analyzeCompatibility(serverInfo) {
    const compatibility = {
      platform: 'unknown',
      nodeVersion: 'unknown',
      pythonVersion: 'unknown',
      issues: [],
      score: 1.0
    };

    // Platform compatibility
    const command = serverInfo.command || '';
    if (command.includes('bash') && process.platform === 'win32') {
      compatibility.issues.push('Bash commands may not work on Windows');
      compatibility.score -= 0.3;
    }

    // Node.js version compatibility
    if (command.includes('node') || command.includes('npx')) {
      compatibility.nodeVersion = 'required';
      // Would check actual Node.js version here
    }

    return compatibility;
  }

  /**
   * Perform health check on installed server
   */
  async performHealthCheck(analysis) {
    let healthScore = 100;
    const issues = [];

    // Check if server is installed
    if (!analysis.isInstalled) {
      healthScore -= 50;
      issues.push('Server is not installed');
    }

    // Check dependencies
    for (const runtime of analysis.dependencies.runtime) {
      try {
        await execAsync(`which ${runtime}`);
      } catch (error) {
        healthScore -= 20;
        issues.push(`Missing runtime dependency: ${runtime}`);
      }
    }

    // Check environment variables
    for (const envVar of analysis.dependencies.environment) {
      if (!process.env[envVar]) {
        healthScore -= 10;
        issues.push(`Missing environment variable: ${envVar}`);
      }
    }

    // Check configuration
    if (!analysis.isConfigured) {
      healthScore -= 15;
      issues.push('Server is not configured');
    }

    analysis.healthScore = Math.max(healthScore, 0);
    analysis.healthStatus = this.getHealthStatus(analysis.healthScore);
    analysis.issues = issues;
  }

  /**
   * Get health status from score
   */
  getHealthStatus(score) {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 50) return 'fair';
    if (score >= 25) return 'poor';
    return 'critical';
  }

  /**
   * Generate recommendations for server
   */
  generateRecommendations(analysis) {
    const recommendations = [];

    if (!analysis.isInstalled && analysis.originalInfo.installCommand) {
      recommendations.push(`Install with: ${analysis.originalInfo.installCommand}`);
    }

    if (analysis.isInstalled && !analysis.isConfigured) {
      recommendations.push('Configure server in .mcp.json file');
    }

    if (analysis.dependencies.environment.length > 0) {
      recommendations.push(`Set environment variables: ${analysis.dependencies.environment.join(', ')}`);
    }

    if (analysis.complexity >= 4) {
      recommendations.push('Complex server - review configuration carefully');
    }

    if (analysis.priority === 'critical' || analysis.priority === 'high') {
      recommendations.push('High priority server - consider installing');
    }

    if (analysis.category === 'filesystem' && !analysis.isConfigured) {
      recommendations.push('Filesystem access - ensure proper permissions');
    }

    analysis.recommendations = recommendations;
  }

  /**
   * Perform cross-server analysis to detect conflicts and redundancies
   */
  performCrossServerAnalysis(analyses) {
    const categoryGroups = {};
    const commandConflicts = new Map();
    
    // Group by category
    for (const analysis of analyses) {
      if (!categoryGroups[analysis.category]) {
        categoryGroups[analysis.category] = [];
      }
      categoryGroups[analysis.category].push(analysis);
    }

    // Detect redundant servers in same category
    for (const [category, servers] of Object.entries(categoryGroups)) {
      if (servers.length > 1) {
        const installedServers = servers.filter(s => s.isInstalled);
        if (installedServers.length > 1) {
          for (const server of installedServers) {
            server.issues.push(`Multiple ${category} servers installed - may cause conflicts`);
            server.recommendations.push(`Consider using only one ${category} server`);
          }
        }
      }
    }

    // Detect command conflicts
    for (const analysis of analyses) {
      const command = analysis.originalInfo.command;
      if (command) {
        if (commandConflicts.has(command)) {
          const existing = commandConflicts.get(command);
          analysis.conflicts.push(existing.id);
          existing.conflicts.push(analysis.id);
          
          analysis.issues.push(`Command conflict with ${existing.name}`);
          existing.issues.push(`Command conflict with ${analysis.name}`);
        } else {
          commandConflicts.set(command, analysis);
        }
      }
    }
  }

  /**
   * Generate comprehensive analysis report
   */
  generateAnalysisReport(analyses) {
    const report = {
      summary: {
        total: analyses.length,
        installed: analyses.filter(a => a.isInstalled).length,
        configured: analyses.filter(a => a.isConfigured).length,
        running: analyses.filter(a => a.isRunning).length,
        healthy: analyses.filter(a => a.healthStatus === 'excellent' || a.healthStatus === 'good').length
      },
      categories: {},
      priorities: {},
      issues: [],
      recommendations: [],
      topServers: analyses
        .filter(a => a.priority === 'critical' || a.priority === 'high')
        .slice(0, 10),
      problemServers: analyses
        .filter(a => a.healthStatus === 'poor' || a.healthStatus === 'critical')
        .slice(0, 5)
    };

    // Group by category
    for (const analysis of analyses) {
      if (!report.categories[analysis.category]) {
        report.categories[analysis.category] = [];
      }
      report.categories[analysis.category].push(analysis);
    }

    // Group by priority
    for (const analysis of analyses) {
      if (!report.priorities[analysis.priority]) {
        report.priorities[analysis.priority] = [];
      }
      report.priorities[analysis.priority].push(analysis);
    }

    // Collect all issues and recommendations
    for (const analysis of analyses) {
      report.issues.push(...analysis.issues);
      report.recommendations.push(...analysis.recommendations);
    }

    // Remove duplicates
    report.issues = [...new Set(report.issues)];
    report.recommendations = [...new Set(report.recommendations)];

    return report;
  }
}

module.exports = MCPServerAnalyzer;