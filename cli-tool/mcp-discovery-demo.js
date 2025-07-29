#!/usr/bin/env node

const path = require('path');
const chalk = require('chalk');
const { MCPServerManager } = require('./src/mcp-discovery');

/**
 * Demo script for MCP Discovery System
 */
async function runMCPDiscoveryDemo() {
  console.log(chalk.blue('🔌 MCP Discovery System Demo'));
  console.log(chalk.gray('Testing comprehensive MCP server detection and management\n'));

  try {
    // Use current directory as test project
    const projectPath = process.cwd();
    
    console.log(chalk.blue(`📁 Project Path: ${projectPath}\n`));

    // Initialize MCP Server Manager
    const mcpManager = new MCPServerManager(projectPath);
    
    // Run a simplified discovery demo
    console.log(chalk.yellow('📡 Running MCP Discovery...'));
    await mcpManager.discoveryEngine.runDiscovery({ saveResults: true });
    
    // Display summary
    const summary = mcpManager.discoveryEngine.getDiscoverySummary();
    
    console.log(chalk.green('\n✅ Discovery Complete! Summary:'));
    console.log(chalk.gray(`  Total servers found: ${summary.totalServers}`));
    console.log(chalk.gray(`  Installed servers: ${summary.installedServers}`));
    console.log(chalk.gray(`  Configured servers: ${summary.configuredServers}`));
    console.log(chalk.gray(`  Categories discovered: ${summary.categories}`));
    console.log(chalk.gray(`  Issues found: ${summary.issues}`));
    console.log(chalk.gray(`  Recommendations: ${summary.recommendations}`));
    
    // Show some example servers
    const servers = mcpManager.discoveryEngine.discoveryResults.analyses;
    
    if (servers.length > 0) {
      console.log(chalk.blue('\n📋 Sample Discovered Servers:'));
      
      servers.slice(0, 5).forEach((server, index) => {
        const status = server.isInstalled ? chalk.green('✅ Installed') : 
                      server.originalInfo.installCommand ? chalk.yellow('📦 Available') : 
                      chalk.gray('❓ Unknown');
        
        console.log(chalk.gray(`  ${index + 1}. ${chalk.bold(server.name)} (${server.category})`));
        console.log(chalk.gray(`     Status: ${status}`));
        console.log(chalk.gray(`     Priority: ${server.priority}`));
        console.log(chalk.gray(`     Description: ${server.originalInfo.description || 'No description'}`));
        console.log('');
      });
    }

    // Show recommended servers
    const recommended = mcpManager.discoveryEngine.getRecommendedServers(3);
    if (recommended.length > 0) {
      console.log(chalk.yellow('⭐ Top Recommended Servers for Installation:'));
      
      recommended.forEach((server, index) => {
        console.log(chalk.gray(`  ${index + 1}. ${chalk.bold(server.name)}`));
        console.log(chalk.gray(`     Category: ${server.category}`));
        console.log(chalk.gray(`     Install: ${server.originalInfo.installCommand || 'N/A'}`));
        console.log('');
      });
    }

    // Show servers needing attention
    const needsAttention = mcpManager.discoveryEngine.getServersNeedingAttention();
    if (needsAttention.length > 0) {
      console.log(chalk.red('⚠️  Servers Needing Attention:'));
      
      needsAttention.slice(0, 3).forEach((server, index) => {
        console.log(chalk.gray(`  ${index + 1}. ${chalk.bold(server.name)}`));
        console.log(chalk.gray(`     Health: ${server.healthStatus} (${server.healthScore}%)`));
        if (server.issues.length > 0) {
          console.log(chalk.red(`     Issues: ${server.issues.slice(0, 2).join(', ')}`));
        }
        console.log('');
      });
    }

    console.log(chalk.green('🎉 MCP Discovery Demo completed successfully!'));
    console.log(chalk.blue('💡 Run with --mcp-discovery to access the full management interface'));
    
  } catch (error) {
    console.error(chalk.red('❌ Demo failed:'), error.message);
    if (error.stack) {
      console.error(chalk.gray(error.stack));
    }
  }
}

// Run the demo if called directly
if (require.main === module) {
  runMCPDiscoveryDemo().catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}

module.exports = { runMCPDiscoveryDemo };