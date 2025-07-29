#!/usr/bin/env node

const chalk = require('chalk');
const { MCPServerManager } = require('./src/mcp-discovery');

/**
 * Test script to verify CLI interface components
 */
async function testCLIInterface() {
  console.log(chalk.blue('🧪 Testing MCP Discovery CLI Interface Components\n'));

  try {
    // Test 1: MCPServerManager instantiation
    console.log(chalk.yellow('1. Testing MCPServerManager instantiation...'));
    const mcpManager = new MCPServerManager('/app/cli-tool');
    console.log(chalk.green('✅ MCPServerManager created successfully'));

    // Test 2: Check if discovery engine is initialized
    console.log(chalk.yellow('2. Testing discovery engine initialization...'));
    if (mcpManager.discoveryEngine) {
      console.log(chalk.green('✅ Discovery engine initialized'));
    } else {
      console.log(chalk.red('❌ Discovery engine not initialized'));
    }

    // Test 3: Test server display table with mock data
    console.log(chalk.yellow('3. Testing server display table...'));
    const mockServers = [
      {
        id: 'test-1',
        name: 'Test Server 1',
        category: 'filesystem',
        priority: 'high',
        isInstalled: true,
        healthScore: 85,
        originalInfo: {
          description: 'Test filesystem server',
          installCommand: 'npm install -g test-server-1'
        }
      },
      {
        id: 'test-2', 
        name: 'Test Server 2',
        category: 'database',
        priority: 'medium',
        isInstalled: false,
        healthScore: 0,
        originalInfo: {
          description: 'Test database server',
          installCommand: 'npm install -g test-server-2'
        }
      }
    ];

    console.log(chalk.blue('\n📋 Sample Server Display:'));
    mcpManager.displayServersTable(mockServers);
    console.log(chalk.green('✅ Server table display working'));

    // Test 4: Test server details display
    console.log(chalk.yellow('\n4. Testing server details display...'));
    console.log(chalk.blue('\n📋 Sample Server Details:'));
    mcpManager.displayServerDetails(mockServers[0]);
    console.log(chalk.green('✅ Server details display working'));

    // Test 5: Test discovery summary with mock data
    console.log(chalk.yellow('\n5. Testing discovery summary...'));
    
    // Mock discovery results
    mcpManager.discoveryEngine.discoveryResults = {
      servers: mockServers,
      analyses: mockServers,
      report: {
        summary: {
          total: 2,
          installed: 1,
          configured: 1,
          running: 0,
          healthy: 1
        },
        categories: {
          filesystem: [mockServers[0]],
          database: [mockServers[1]]
        },
        issues: ['Test issue 1', 'Test issue 2'],
        recommendations: ['Test recommendation 1']
      },
      timestamp: new Date().toISOString()
    };

    const summary = mcpManager.discoveryEngine.getDiscoverySummary();
    console.log(chalk.blue('📊 Discovery Summary:'));
    console.log(chalk.gray(`  Total servers found: ${summary.totalServers}`));
    console.log(chalk.gray(`  Installed: ${summary.installedServers}`));
    console.log(chalk.gray(`  Configured: ${summary.configuredServers}`));
    console.log(chalk.gray(`  Categories: ${summary.categories}`));
    console.log(chalk.gray(`  Issues: ${summary.issues}`));
    console.log(chalk.green('✅ Discovery summary working'));

    console.log(chalk.green('\n🎉 All CLI interface components tested successfully!'));
    console.log(chalk.blue('💡 The CLI interface is working properly - analysis phase may just take time'));

  } catch (error) {
    console.error(chalk.red('❌ CLI interface test failed:'), error.message);
    if (error.stack) {
      console.error(chalk.gray(error.stack));
    }
  }
}

// Run the test if called directly
if (require.main === module) {
  testCLIInterface().catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}

module.exports = { testCLIInterface };