#!/usr/bin/env node

/**
 * Comprehensive Backend Tests for MCP Discovery System
 * Tests all core components: Detection, Analysis, Engine, Manager, CLI Integration
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Import MCP Discovery components
const MCPServerDetector = require('./src/mcp-discovery/MCPServerDetector');
const MCPServerAnalyzer = require('./src/mcp-discovery/MCPServerAnalyzer');
const MCPDiscoveryEngine = require('./src/mcp-discovery/MCPDiscoveryEngine');
const { MCPServerManager } = require('./src/mcp-discovery');

class MCPDiscoveryTester {
  constructor() {
    this.testResults = {
      detection: { passed: 0, failed: 0, tests: [] },
      analysis: { passed: 0, failed: 0, tests: [] },
      engine: { passed: 0, failed: 0, tests: [] },
      manager: { passed: 0, failed: 0, tests: [] },
      cli: { passed: 0, failed: 0, tests: [] },
      demo: { passed: 0, failed: 0, tests: [] }
    };
    this.testProjectPath = __dirname;
  }

  /**
   * Run all MCP Discovery System tests
   */
  async runAllTests() {
    console.log(chalk.blue('Testing MCP Discovery System\n'));

    try {
      // Test 1: MCP Server Detection Engine
      await this.testMCPServerDetection();
      
      // Test 2: MCP Server Analysis System
      await this.testMCPServerAnalysis();
      
      // Test 3: MCP Discovery Engine Orchestrator
      await this.testMCPDiscoveryEngine();
      
      // Test 4: MCP Server Management Interface
      await this.testMCPServerManager();
      
      // Test 5: CLI Integration
      await this.testCLIIntegration();
      
      // Test 6: Demo Script
      await this.testDemoScript();
      
      // Generate final report
      this.generateTestReport();
      
    } catch (error) {
      console.error(chalk.red('Test suite failed:'), error.message);
      throw error;
    }
  }

  /**
   * Test MCP Server Detection Engine
   */
  async testMCPServerDetection() {
    console.log(chalk.yellow('Testing MCP Server Detection Engine...'));
    
    try {
      const detector = new MCPServerDetector();
      
      // Test 1: Basic instantiation
      await this.runTest('detection', 'Detector Instantiation', async () => {
        if (!detector || typeof detector.detectAllMCPServers !== 'function') {
          throw new Error('MCPServerDetector not properly instantiated');
        }
        return 'Detector instantiated successfully';
      });

      // Test 2: Detection results structure
      await this.runTest('detection', 'Detection Results Structure', async () => {
        const results = await detector.detectAllMCPServers(this.testProjectPath);
        
        if (!results || typeof results !== 'object') {
          throw new Error('Detection results should be an object');
        }
        
        const expectedKeys = ['global', 'project', 'workspace', 'systemPackages', 'discovered'];
        for (const key of expectedKeys) {
          if (!Array.isArray(results[key])) {
            throw new Error(`Detection results should have ${key} as array`);
          }
        }
        
        return `Detection found ${Object.values(results).flat().length} total entries`;
      });

      // Test 3: Get all detected servers
      await this.runTest('detection', 'Get All Detected Servers', async () => {
        const allServers = detector.getAllDetectedServers();
        
        if (!Array.isArray(allServers)) {
          throw new Error('getAllDetectedServers should return an array');
        }
        
        // Validate server structure
        if (allServers.length > 0) {
          const server = allServers[0];
          const requiredFields = ['id', 'name', 'location', 'source', 'type'];
          
          for (const field of requiredFields) {
            if (!server.hasOwnProperty(field)) {
              throw new Error(`Server should have ${field} field`);
            }
          }
        }
        
        return `Found ${allServers.length} unique servers`;
      });

      // Test 4: MCP package detection logic
      await this.runTest('detection', 'MCP Package Detection Logic', async () => {
        const testPackages = [
          { name: 'mcp-server-test', description: 'Test MCP server' },
          { name: '@modelcontextprotocol/server-filesystem', description: 'Filesystem MCP' },
          { name: 'regular-package', description: 'Not an MCP package' }
        ];
        
        let mcpCount = 0;
        for (const pkg of testPackages) {
          if (detector.isMCPPackage(pkg.name, pkg)) {
            mcpCount++;
          }
        }
        
        if (mcpCount < 2) {
          throw new Error('MCP package detection logic not working correctly');
        }
        
        return `Correctly identified ${mcpCount} MCP packages out of ${testPackages.length}`;
      });

      // Test 5: Command inference
      await this.runTest('detection', 'Command Inference', async () => {
        const testCases = [
          { package: '@modelcontextprotocol/server-filesystem', expected: 'npx' },
          { package: 'mcp-test-server', expected: 'npx' },
          { file: '/path/to/server.js', expected: 'node' },
          { file: '/path/to/server.py', expected: 'python' }
        ];
        
        for (const testCase of testCases) {
          let command;
          if (testCase.package) {
            command = detector.inferMCPCommand(testCase.package);
          } else if (testCase.file) {
            command = detector.inferCommandFromFile(testCase.file);
          }
          
          if (!command.includes(testCase.expected)) {
            throw new Error(`Command inference failed for ${testCase.package || testCase.file}`);
          }
        }
        
        return 'Command inference working correctly';
      });

      console.log(chalk.green('MCP Server Detection Engine tests completed'));
      
    } catch (error) {
      console.error(chalk.red('Detection Engine tests failed:'), error.message);
      throw error;
    }
  }

  /**
   * Test MCP Server Analysis System
   */
  async testMCPServerAnalysis() {
    console.log(chalk.yellow('Testing MCP Server Analysis System...'));
    
    try {
      const analyzer = new MCPServerAnalyzer();
      
      // Create test server data
      const testServers = [
        {
          id: 'test-filesystem',
          name: 'Filesystem MCP',
          description: 'Access and manipulate files and directories',
          command: 'npx @modelcontextprotocol/server-filesystem',
          location: 'global',
          source: 'curated',
          type: 'available'
        },
        {
          id: 'test-database',
          name: 'Database MCP',
          description: 'Connect to and query databases',
          command: 'npx @modelcontextprotocol/server-database',
          location: 'project',
          source: 'config-file',
          type: 'configured',
          env: { DB_URL: 'test' }
        }
      ];

      // Test 1: Basic analyzer instantiation
      await this.runTest('analysis', 'Analyzer Instantiation', async () => {
        if (!analyzer || typeof analyzer.analyzeMCPServer !== 'function') {
          throw new Error('MCPServerAnalyzer not properly instantiated');
        }
        return 'Analyzer instantiated successfully';
      });

      // Test 2: Single server analysis
      await this.runTest('analysis', 'Single Server Analysis', async () => {
        const analysis = await analyzer.analyzeMCPServer(testServers[0]);
        
        const requiredFields = [
          'id', 'name', 'category', 'complexity', 'priority', 
          'isInstalled', 'isRunning', 'isConfigured', 'capabilities',
          'dependencies', 'compatibility', 'healthStatus', 'healthScore'
        ];
        
        for (const field of requiredFields) {
          if (!analysis.hasOwnProperty(field)) {
            throw new Error(`Analysis should have ${field} field`);
          }
        }
        
        return `Analysis completed with category: ${analysis.category}, priority: ${analysis.priority}`;
      });

      // Test 3: Multiple servers analysis
      await this.runTest('analysis', 'Multiple Servers Analysis', async () => {
        const analyses = await analyzer.analyzeMCPServers(testServers);
        
        if (!Array.isArray(analyses) || analyses.length !== testServers.length) {
          throw new Error('Should return analysis for each server');
        }
        
        return `Analyzed ${analyses.length} servers successfully`;
      });

      // Test 4: Server categorization
      await this.runTest('analysis', 'Server Categorization', async () => {
        const categories = [];
        
        for (const server of testServers) {
          const category = analyzer.categorizeServer(server);
          categories.push(category);
        }
        
        if (categories.length !== testServers.length) {
          throw new Error('Should categorize all servers');
        }
        
        // Check if filesystem server is categorized correctly
        if (!categories.includes('filesystem')) {
          throw new Error('Filesystem server should be categorized as filesystem');
        }
        
        return `Categorized servers: ${categories.join(', ')}`;
      });

      // Test 5: Priority calculation
      await this.runTest('analysis', 'Priority Calculation', async () => {
        const priorities = [];
        
        for (const server of testServers) {
          const priority = analyzer.calculatePriority(server);
          priorities.push(priority);
        }
        
        const validPriorities = ['critical', 'high', 'medium', 'low', 'minimal'];
        for (const priority of priorities) {
          if (!validPriorities.includes(priority)) {
            throw new Error(`Invalid priority: ${priority}`);
          }
        }
        
        return `Calculated priorities: ${priorities.join(', ')}`;
      });

      // Test 6: Complexity calculation
      await this.runTest('analysis', 'Complexity Calculation', async () => {
        for (const server of testServers) {
          const complexity = analyzer.calculateComplexity(server);
          
          if (typeof complexity !== 'number' || complexity < 1 || complexity > 5) {
            throw new Error('Complexity should be a number between 1 and 5');
          }
        }
        
        return 'Complexity calculation working correctly';
      });

      console.log(chalk.green('MCP Server Analysis System tests completed'));
      
    } catch (error) {
      console.error(chalk.red('Analysis System tests failed:'), error.message);
      throw error;
    }
  }

  /**
   * Test MCP Discovery Engine Orchestrator
   */
  async testMCPDiscoveryEngine() {
    console.log(chalk.yellow('Testing MCP Discovery Engine Orchestrator...'));
    
    try {
      const engine = new MCPDiscoveryEngine(this.testProjectPath);
      
      // Test 1: Engine instantiation
      await this.runTest('engine', 'Engine Instantiation', async () => {
        if (!engine || typeof engine.runDiscovery !== 'function') {
          throw new Error('MCPDiscoveryEngine not properly instantiated');
        }
        
        if (!engine.detector || !engine.analyzer) {
          throw new Error('Engine should have detector and analyzer instances');
        }
        
        return 'Engine instantiated with detector and analyzer';
      });

      // Test 2: Run discovery process
      await this.runTest('engine', 'Run Discovery Process', async () => {
        const results = await engine.runDiscovery({ saveResults: false });
        
        if (!results || typeof results !== 'object') {
          throw new Error('Discovery should return results object');
        }
        
        const requiredFields = ['servers', 'analyses', 'report', 'timestamp'];
        for (const field of requiredFields) {
          if (!results.hasOwnProperty(field)) {
            throw new Error(`Results should have ${field} field`);
          }
        }
        
        return `Discovery completed with ${results.servers.length} servers and ${results.analyses.length} analyses`;
      });

      // Test 3: Discovery summary
      await this.runTest('engine', 'Discovery Summary', async () => {
        const summary = engine.getDiscoverySummary();
        
        if (!summary || typeof summary !== 'object') {
          throw new Error('Summary should be an object');
        }
        
        const requiredFields = ['totalServers', 'installedServers', 'configuredServers', 'categories'];
        for (const field of requiredFields) {
          if (!summary.hasOwnProperty(field)) {
            throw new Error(`Summary should have ${field} field`);
          }
        }
        
        return `Summary: ${summary.totalServers} total, ${summary.categories} categories`;
      });

      // Test 4: Server filtering by category
      await this.runTest('engine', 'Server Filtering by Category', async () => {
        const filesystemServers = engine.getServersByCategory('filesystem');
        const webServers = engine.getServersByCategory('web-api');
        
        if (!Array.isArray(filesystemServers) || !Array.isArray(webServers)) {
          throw new Error('Category filtering should return arrays');
        }
        
        return `Found ${filesystemServers.length} filesystem and ${webServers.length} web servers`;
      });

      // Test 5: Server filtering by priority
      await this.runTest('engine', 'Server Filtering by Priority', async () => {
        const highPriorityServers = engine.getServersByPriority('high');
        const criticalServers = engine.getServersByPriority('critical');
        
        if (!Array.isArray(highPriorityServers) || !Array.isArray(criticalServers)) {
          throw new Error('Priority filtering should return arrays');
        }
        
        return `Found ${highPriorityServers.length} high priority and ${criticalServers.length} critical servers`;
      });

      // Test 6: Server search functionality
      await this.runTest('engine', 'Server Search Functionality', async () => {
        const searchResults = engine.searchServers('filesystem');
        
        if (!Array.isArray(searchResults)) {
          throw new Error('Search should return an array');
        }
        
        return `Search for 'filesystem' returned ${searchResults.length} results`;
      });

      // Test 7: Recommended servers
      await this.runTest('engine', 'Recommended Servers', async () => {
        const recommended = engine.getRecommendedServers(5);
        
        if (!Array.isArray(recommended)) {
          throw new Error('Recommended servers should return an array');
        }
        
        return `Found ${recommended.length} recommended servers`;
      });

      // Test 8: Markdown report generation
      await this.runTest('engine', 'Markdown Report Generation', async () => {
        const markdown = engine.generateMarkdownReport();
        
        if (typeof markdown !== 'string' || markdown.length === 0) {
          throw new Error('Markdown report should be a non-empty string');
        }
        
        // Check for key sections
        const requiredSections = ['# MCP Server Discovery Report', '## Executive Summary', '## Server Categories'];
        for (const section of requiredSections) {
          if (!markdown.includes(section)) {
            throw new Error(`Markdown report should include ${section}`);
          }
        }
        
        return `Generated markdown report (${markdown.length} characters)`;
      });

      console.log(chalk.green('MCP Discovery Engine Orchestrator tests completed'));
      
    } catch (error) {
      console.error(chalk.red('Discovery Engine tests failed:'), error.message);
      throw error;
    }
  }

  /**
   * Test MCP Server Management Interface
   */
  async testMCPServerManager() {
    console.log(chalk.yellow('Testing MCP Server Management Interface...'));
    
    try {
      const manager = new MCPServerManager(this.testProjectPath);
      
      // Test 1: Manager instantiation
      await this.runTest('manager', 'Manager Instantiation', async () => {
        if (!manager || typeof manager.run !== 'function') {
          throw new Error('MCPServerManager not properly instantiated');
        }
        
        if (!manager.discoveryEngine) {
          throw new Error('Manager should have discoveryEngine instance');
        }
        
        return 'Manager instantiated with discovery engine';
      });

      // Test 2: Discovery engine integration
      await this.runTest('manager', 'Discovery Engine Integration', async () => {
        if (!manager.discoveryEngine || typeof manager.discoveryEngine.runDiscovery !== 'function') {
          throw new Error('Manager should have functional discovery engine');
        }
        
        return 'Discovery engine properly integrated';
      });

      // Test 3: Project path configuration
      await this.runTest('manager', 'Project Path Configuration', async () => {
        if (manager.projectPath !== this.testProjectPath) {
          throw new Error('Manager should use provided project path');
        }
        
        const mcpConfigPath = path.join(this.testProjectPath, '.mcp.json');
        if (manager.mcpConfigPath !== mcpConfigPath) {
          throw new Error('MCP config path should be correctly set');
        }
        
        return 'Project paths configured correctly';
      });

      // Test 4: Server display functionality
      await this.runTest('manager', 'Server Display Functionality', async () => {
        // Run discovery first to have data
        await manager.discoveryEngine.runDiscovery({ saveResults: false });
        
        const servers = manager.discoveryEngine.discoveryResults.analyses;
        
        // Test displayServersTable method exists and can handle empty arrays
        if (typeof manager.displayServersTable !== 'function') {
          throw new Error('Manager should have displayServersTable method');
        }
        
        // This should not throw an error
        manager.displayServersTable([]);
        manager.displayServersTable(servers.slice(0, 3));
        
        return 'Server display functionality working';
      });

      console.log(chalk.green('MCP Server Management Interface tests completed'));
      
    } catch (error) {
      console.error(chalk.red('Management Interface tests failed:'), error.message);
      throw error;
    }
  }

  /**
   * Test CLI Integration
   */
  async testCLIIntegration() {
    console.log(chalk.yellow('Testing CLI Integration...'));
    
    try {
      // Test 1: Main index.js file structure
      await this.runTest('cli', 'Main Index File Structure', async () => {
        const indexPath = path.join(this.testProjectPath, 'src', 'index.js');
        
        if (!(await fs.pathExists(indexPath))) {
          throw new Error('Main index.js file should exist');
        }
        
        const indexContent = await fs.readFile(indexPath, 'utf8');
        
        // Check for MCP Discovery imports and functions
        if (!indexContent.includes('MCPServerManager')) {
          throw new Error('Index should import MCPServerManager');
        }
        
        if (!indexContent.includes('runMCPDiscovery')) {
          throw new Error('Index should have runMCPDiscovery function');
        }
        
        return 'Main index file structure is correct';
      });

      // Test 2: MCP Discovery menu option
      await this.runTest('cli', 'MCP Discovery Menu Option', async () => {
        const indexPath = path.join(this.testProjectPath, 'src', 'index.js');
        const indexContent = await fs.readFile(indexPath, 'utf8');
        
        if (!indexContent.includes('MCP Discovery')) {
          throw new Error('Main menu should include MCP Discovery option');
        }
        
        if (!indexContent.includes('mcp-discovery')) {
          throw new Error('Menu should have mcp-discovery value');
        }
        
        return 'MCP Discovery menu option present';
      });

      // Test 3: CLI command handling
      await this.runTest('cli', 'CLI Command Handling', async () => {
        const indexPath = path.join(this.testProjectPath, 'src', 'index.js');
        const indexContent = await fs.readFile(indexPath, 'utf8');
        
        // Check for various MCP discovery command options
        const mcpCommands = ['mcpDiscovery', 'mcpManager', 'mcpDiscover'];
        let foundCommands = 0;
        
        for (const command of mcpCommands) {
          if (indexContent.includes(command)) {
            foundCommands++;
          }
        }
        
        if (foundCommands === 0) {
          throw new Error('Should handle MCP discovery command options');
        }
        
        return `Found ${foundCommands} MCP command handlers`;
      });

      // Test 4: Package.json bin configuration
      await this.runTest('cli', 'Package.json Bin Configuration', async () => {
        const packagePath = path.join(this.testProjectPath, 'package.json');
        const packageJson = await fs.readJSON(packagePath);
        
        if (!packageJson.bin || Object.keys(packageJson.bin).length === 0) {
          throw new Error('Package should have bin configuration');
        }
        
        return `Package has ${Object.keys(packageJson.bin).length} bin entries`;
      });

      console.log(chalk.green('CLI Integration tests completed'));
      
    } catch (error) {
      console.error(chalk.red('CLI Integration tests failed:'), error.message);
      throw error;
    }
  }

  /**
   * Test Demo Script
   */
  async testDemoScript() {
    console.log(chalk.yellow('Testing MCP Discovery Demo Script...'));
    
    try {
      const demoPath = path.join(this.testProjectPath, 'mcp-discovery-demo.js');
      
      // Test 1: Demo script exists
      await this.runTest('demo', 'Demo Script Exists', async () => {
        const demoPath = path.join(this.testProjectPath, 'mcp-discovery-demo.js');
        
        if (!(await fs.pathExists(demoPath))) {
          throw new Error('Demo script should exist');
        }
        
        return 'Demo script file exists';
      });

      // Test 2: Demo script structure
      await this.runTest('demo', 'Demo Script Structure', async () => {
        const demoPath = path.join(this.testProjectPath, 'mcp-discovery-demo.js');
        const demoContent = await fs.readFile(demoPath, 'utf8');
        
        if (!demoContent.includes('runMCPDiscoveryDemo')) {
          throw new Error('Demo should have runMCPDiscoveryDemo function');
        }
        
        if (!demoContent.includes('MCPServerManager')) {
          throw new Error('Demo should import MCPServerManager');
        }
        
        return 'Demo script structure is correct';
      });

      // Test 3: Demo script execution (basic syntax check)
      await this.runTest('demo', 'Demo Script Syntax Check', async () => {
        try {
          // Try to require the demo script to check for syntax errors
          const demoPath = path.join(this.testProjectPath, 'mcp-discovery-demo.js');
          const demoModule = require(demoPath);
          
          if (typeof demoModule.runMCPDiscoveryDemo !== 'function') {
            throw new Error('Demo should export runMCPDiscoveryDemo function');
          }
          
          return 'Demo script syntax is valid';
        } catch (error) {
          throw new Error(`Demo script syntax error: ${error.message}`);
        }
      });

      // Test 4: Demo script can be executed (without full run)
      await this.runTest('demo', 'Demo Script Execution Test', async () => {
        try {
          // Test that we can at least instantiate the components used in demo
          const { MCPServerManager } = require(path.join(this.testProjectPath, 'src', 'mcp-discovery'));
          const manager = new MCPServerManager(this.testProjectPath);
          
          if (!manager.discoveryEngine) {
            throw new Error('Demo dependencies should work correctly');
          }
          
          return 'Demo script dependencies are functional';
        } catch (error) {
          throw new Error(`Demo execution test failed: ${error.message}`);
        }
      });

      console.log(chalk.green('MCP Discovery Demo Script tests completed'));
      
    } catch (error) {
      console.error(chalk.red('Demo Script tests failed:'), error.message);
      throw error;
    }
  }

  /**
   * Helper method to run individual tests
   */
  async runTest(category, testName, testFunction) {
    try {
      const result = await testFunction();
      this.testResults[category].passed++;
      this.testResults[category].tests.push({
        name: testName,
        status: 'PASSED',
        message: result
      });
      console.log(chalk.green(`  PASS ${testName}: ${result}`));
    } catch (error) {
      this.testResults[category].failed++;
      this.testResults[category].tests.push({
        name: testName,
        status: 'FAILED',
        message: error.message
      });
      console.log(chalk.red(`  FAIL ${testName}: ${error.message}`));
    }
  }

  /**
   * Generate comprehensive test report
   */
  generateTestReport() {
    console.log(chalk.blue('\nMCP Discovery System Test Report'));
    console.log(chalk.gray('='.repeat(60)));
    
    let totalPassed = 0;
    let totalFailed = 0;
    
    for (const [category, results] of Object.entries(this.testResults)) {
      const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
      const total = results.passed + results.failed;
      
      if (total > 0) {
        console.log(chalk.blue(`\n${categoryName} Tests:`));
        console.log(chalk.gray(`  Total: ${total}, Passed: ${results.passed}, Failed: ${results.failed}`));
        
        if (results.failed > 0) {
          console.log(chalk.red('  Failed Tests:'));
          results.tests
            .filter(test => test.status === 'FAILED')
            .forEach(test => {
              console.log(chalk.red(`    - ${test.name}: ${test.message}`));
            });
        }
        
        totalPassed += results.passed;
        totalFailed += results.failed;
      }
    }
    
    console.log(chalk.blue('\nOverall Results:'));
    console.log(chalk.gray(`  Total Tests: ${totalPassed + totalFailed}`));
    console.log(chalk.green(`  Passed: ${totalPassed}`));
    console.log(chalk.red(`  Failed: ${totalFailed}`));
    
    const successRate = totalPassed + totalFailed > 0 ? 
      ((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1) : 0;
    
    console.log(chalk.blue(`  Success Rate: ${successRate}%`));
    
    if (totalFailed === 0) {
      console.log(chalk.green('\nAll MCP Discovery System tests passed!'));
    } else {
      console.log(chalk.yellow(`\n${totalFailed} test(s) failed. Review the issues above.`));
    }
    
    return {
      totalPassed,
      totalFailed,
      successRate: parseFloat(successRate),
      categories: this.testResults
    };
  }
}

// Main execution
async function main() {
  const tester = new MCPDiscoveryTester();
  
  try {
    const results = await tester.runAllTests();
    
    // Exit with appropriate code
    process.exit(results.totalFailed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error(chalk.red('\nTest suite crashed:'), error.message);
    console.error(chalk.gray(error.stack));
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  main();
}

module.exports = { MCPDiscoveryTester };