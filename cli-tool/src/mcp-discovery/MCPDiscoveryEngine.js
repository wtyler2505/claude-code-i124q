const MCPServerDetector = require('./MCPServerDetector');
const MCPServerAnalyzer = require('./MCPServerAnalyzer');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');

/**
 * MCP Discovery Engine - Main orchestrator for MCP server discovery and analysis
 */
class MCPDiscoveryEngine {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.detector = new MCPServerDetector();
    this.analyzer = new MCPServerAnalyzer();
    
    this.discoveryResults = {
      servers: [],
      analyses: [],
      report: null,
      timestamp: null
    };
  }

  /**
   * Run comprehensive MCP discovery and analysis
   */
  async runDiscovery(options = {}) {
    const spinner = ora('🔍 Running comprehensive MCP server discovery...').start();
    
    try {
      // Phase 1: Detection
      spinner.text = '📡 Detecting MCP servers...';
      const detectionResults = await this.detector.detectAllMCPServers(this.projectPath);
      this.discoveryResults.servers = this.detector.getAllDetectedServers();
      
      spinner.text = '🔬 Analyzing MCP servers...';
      // Phase 2: Analysis
      this.discoveryResults.analyses = await this.analyzer.analyzeMCPServers(this.discoveryResults.servers);
      
      // Phase 3: Generate Report
      spinner.text = '📊 Generating discovery report...';
      this.discoveryResults.report = this.analyzer.generateAnalysisReport(this.discoveryResults.analyses);
      this.discoveryResults.timestamp = new Date().toISOString();
      
      // Phase 4: Save Results
      if (options.saveResults !== false) {
        await this.saveDiscoveryResults();
      }
      
      spinner.succeed('✅ MCP discovery completed successfully');
      
      return this.discoveryResults;
      
    } catch (error) {
      spinner.fail('❌ MCP discovery failed');
      console.error(chalk.red('Error:'), error.message);
      throw error;
    }
  }

  /**
   * Get discovery summary
   */
  getDiscoverySummary() {
    if (!this.discoveryResults.report) {
      return null;
    }

    const { report, servers } = this.discoveryResults;
    
    return {
      totalServers: servers.length,
      installedServers: report.summary.installed,
      configuredServers: report.summary.configured,
      categories: Object.keys(report.categories).length,
      topPriority: report.topServers.length,
      issues: report.issues.length,
      recommendations: report.recommendations.length,
      timestamp: this.discoveryResults.timestamp
    };
  }

  /**
   * Get servers by category
   */
  getServersByCategory(category) {
    if (!this.discoveryResults.analyses) {
      return [];
    }

    return this.discoveryResults.analyses.filter(analysis => 
      analysis.category === category
    );
  }

  /**
   * Get servers by priority
   */
  getServersByPriority(priority) {
    if (!this.discoveryResults.analyses) {
      return [];
    }

    return this.discoveryResults.analyses.filter(analysis => 
      analysis.priority === priority
    );
  }

  /**
   * Get servers by status
   */
  getServersByStatus(status) {
    if (!this.discoveryResults.analyses) {
      return [];
    }

    const filters = {
      installed: (analysis) => analysis.isInstalled,
      configured: (analysis) => analysis.isConfigured,
      running: (analysis) => analysis.isRunning,
      healthy: (analysis) => analysis.healthStatus === 'excellent' || analysis.healthStatus === 'good',
      problematic: (analysis) => analysis.healthStatus === 'poor' || analysis.healthStatus === 'critical',
      available: (analysis) => !analysis.isInstalled && analysis.originalInfo.installCommand
    };

    const filter = filters[status];
    return filter ? this.discoveryResults.analyses.filter(filter) : [];
  }

  /**
   * Search servers by name, description, or category
   */
  searchServers(query) {
    if (!this.discoveryResults.analyses) {
      return [];
    }

    const searchTerm = query.toLowerCase();
    
    return this.discoveryResults.analyses.filter(analysis => 
      analysis.name.toLowerCase().includes(searchTerm) ||
      (analysis.originalInfo.description || '').toLowerCase().includes(searchTerm) ||
      analysis.category.toLowerCase().includes(searchTerm) ||
      (analysis.originalInfo.command || '').toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Get recommended servers for installation
   */
  getRecommendedServers(limit = 10) {
    if (!this.discoveryResults.analyses) {
      return [];
    }

    return this.discoveryResults.analyses
      .filter(analysis => 
        !analysis.isInstalled && 
        (analysis.priority === 'critical' || analysis.priority === 'high') &&
        analysis.originalInfo.installCommand
      )
      .sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1, minimal: 0 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, limit);
  }

  /**
   * Get servers that need attention (issues, conflicts)
   */
  getServersNeedingAttention() {
    if (!this.discoveryResults.analyses) {
      return [];
    }

    return this.discoveryResults.analyses.filter(analysis => 
      analysis.issues.length > 0 || 
      analysis.conflicts.length > 0 ||
      analysis.healthStatus === 'poor' ||
      analysis.healthStatus === 'critical'
    );
  }

  /**
   * Generate installation script for selected servers
   */
  generateInstallationScript(serverIds, scriptType = 'bash') {
    const selectedServers = this.discoveryResults.analyses.filter(analysis => 
      serverIds.includes(analysis.id) && 
      analysis.originalInfo.installCommand &&
      !analysis.isInstalled
    );

    if (selectedServers.length === 0) {
      return null;
    }

    let script = '';
    
    if (scriptType === 'bash') {
      script += '#!/bin/bash\n\n';
      script += '# MCP Server Installation Script\n';
      script += `# Generated on ${new Date().toISOString()}\n\n`;
      
      script += 'echo "Installing MCP servers..."\n\n';
      
      for (const server of selectedServers) {
        script += `echo "Installing ${server.name}..."\n`;
        script += `${server.originalInfo.installCommand}\n`;
        script += 'if [ $? -eq 0 ]; then\n';
        script += `  echo "✅ ${server.name} installed successfully"\n`;
        script += 'else\n';
        script += `  echo "❌ Failed to install ${server.name}"\n`;
        script += 'fi\n\n';
      }
      
      script += 'echo "Installation complete!"\n';
    }

    return {
      script,
      servers: selectedServers.map(s => ({ id: s.id, name: s.name, command: s.originalInfo.installCommand })),
      type: scriptType
    };
  }

  /**
   * Generate configuration template for selected servers
   */
  generateConfigurationTemplate(serverIds) {
    const selectedServers = this.discoveryResults.analyses.filter(analysis => 
      serverIds.includes(analysis.id)
    );

    if (selectedServers.length === 0) {
      return null;
    }

    const mcpConfig = {
      mcpServers: {}
    };

    for (const server of selectedServers) {
      const serverId = server.id.replace(/^[^-]+-/, ''); // Remove prefix
      
      mcpConfig.mcpServers[serverId] = {
        name: server.name,
        description: server.originalInfo.description || 'No description provided',
        command: server.originalInfo.command,
        args: server.originalInfo.args || [],
        env: server.originalInfo.env || {}
      };

      // Add environment variable placeholders
      if (server.dependencies && server.dependencies.environment.length > 0) {
        for (const envVar of server.dependencies.environment) {
          if (!mcpConfig.mcpServers[serverId].env[envVar]) {
            mcpConfig.mcpServers[serverId].env[envVar] = `<SET_${envVar}_VALUE>`;
          }
        }
      }
    }

    return {
      config: mcpConfig,
      servers: selectedServers.map(s => ({ 
        id: s.id, 
        name: s.name, 
        category: s.category,
        recommendations: s.recommendations
      }))
    };
  }

  /**
   * Save discovery results to file
   */
  async saveDiscoveryResults() {
    const resultsDir = path.join(this.projectPath, '.claude', 'mcp-discovery');
    await fs.ensureDir(resultsDir);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsFile = path.join(resultsDir, `discovery-results-${timestamp}.json`);
    
    await fs.writeJSON(resultsFile, this.discoveryResults, { spaces: 2 });

    // Also save a human-readable report
    const reportFile = path.join(resultsDir, `discovery-report-${timestamp}.md`);
    const markdownReport = this.generateMarkdownReport();
    await fs.writeFile(reportFile, markdownReport, 'utf8');

    console.log(chalk.blue(`📁 Discovery results saved to: ${resultsFile}`));
    console.log(chalk.blue(`📄 Discovery report saved to: ${reportFile}`));

    return { resultsFile, reportFile };
  }

  /**
   * Generate markdown report
   */
  generateMarkdownReport() {
    const { report, servers, timestamp } = this.discoveryResults;
    
    if (!report) {
      return '# MCP Discovery Report\n\nNo data available.';
    }

    let markdown = `# MCP Server Discovery Report

**Generated**: ${new Date(timestamp).toLocaleString()}
**Project**: ${path.basename(this.projectPath)}
**Total Servers Found**: ${servers.length}

## Executive Summary

- **Installed Servers**: ${report.summary.installed}
- **Configured Servers**: ${report.summary.configured}
- **Running Servers**: ${report.summary.running}
- **Healthy Servers**: ${report.summary.healthy}
- **Categories**: ${Object.keys(report.categories).length}
- **Issues Found**: ${report.issues.length}

## Server Categories

`;

    for (const [category, categoryServers] of Object.entries(report.categories)) {
      markdown += `### ${category.charAt(0).toUpperCase() + category.slice(1)} (${categoryServers.length} servers)

`;
      
      for (const server of categoryServers.slice(0, 5)) { // Limit to top 5 per category
        const status = server.isInstalled ? '✅ Installed' : 
                      server.originalInfo.installCommand ? '📦 Available' : '❓ Unknown';
        const health = server.healthScore > 0 ? ` (Health: ${server.healthScore}%)` : '';
        
        markdown += `- **${server.name}**: ${status}${health}
  - ${server.originalInfo.description || 'No description'}
  - Priority: ${server.priority}
  - Complexity: ${server.complexity}/5

`;
      }
    }

    markdown += `## Priority Servers

### Critical Priority
`;
    const criticalServers = report.priorities.critical || [];
    for (const server of criticalServers.slice(0, 5)) {
      markdown += `- **${server.name}**: ${server.originalInfo.description || 'No description'}
`;
    }

    markdown += `
### High Priority
`;
    const highServers = report.priorities.high || [];
    for (const server of highServers.slice(0, 5)) {
      markdown += `- **${server.name}**: ${server.originalInfo.description || 'No description'}
`;
    }

    if (report.issues.length > 0) {
      markdown += `
## Issues Found

`;
      for (const issue of report.issues.slice(0, 10)) {
        markdown += `- ${issue}
`;
      }
    }

    if (report.recommendations.length > 0) {
      markdown += `
## Recommendations

`;
      for (const recommendation of report.recommendations.slice(0, 10)) {
        markdown += `- ${recommendation}
`;
      }
    }

    markdown += `
## Installation Commands

### Recommended Installations
`;

    const recommendedServers = this.getRecommendedServers(5);
    for (const server of recommendedServers) {
      if (server.originalInfo.installCommand) {
        markdown += `\`\`\`bash
# ${server.name}
${server.originalInfo.installCommand}
\`\`\`

`;
      }
    }

    markdown += `
---
*Generated by Claude Code MCP Discovery Engine*
`;

    return markdown;
  }

  /**
   * Load previous discovery results
   */
  async loadDiscoveryResults(resultsFile) {
    try {
      if (await fs.pathExists(resultsFile)) {
        this.discoveryResults = await fs.readJSON(resultsFile);
        return true;
      }
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Could not load previous results:'), error.message);
    }
    return false;
  }

  /**
   * Get latest discovery results file
   */
  async getLatestDiscoveryResults() {
    const resultsDir = path.join(this.projectPath, '.claude', 'mcp-discovery');
    
    if (!(await fs.pathExists(resultsDir))) {
      return null;
    }

    const files = await fs.readdir(resultsDir);
    const resultFiles = files
      .filter(f => f.startsWith('discovery-results-') && f.endsWith('.json'))
      .sort()
      .reverse();

    return resultFiles.length > 0 ? path.join(resultsDir, resultFiles[0]) : null;
  }

  /**
   * Compare with previous discovery results
   */
  async compareWithPrevious() {
    const latestFile = await this.getLatestDiscoveryResults();
    if (!latestFile) {
      return null;
    }

    try {
      const previousResults = await fs.readJSON(latestFile);
      const currentServers = new Set(this.discoveryResults.servers.map(s => s.id));
      const previousServers = new Set(previousResults.servers.map(s => s.id));

      return {
        added: [...currentServers].filter(id => !previousServers.has(id)),
        removed: [...previousServers].filter(id => !currentServers.has(id)),
        common: [...currentServers].filter(id => previousServers.has(id)),
        previousFile: latestFile,
        previousTimestamp: previousResults.timestamp
      };
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Could not compare with previous results:'), error.message);
      return null;
    }
  }
}

module.exports = MCPDiscoveryEngine;