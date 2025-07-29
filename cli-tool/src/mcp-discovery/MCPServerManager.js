const MCPDiscoveryEngine = require('./MCPDiscoveryEngine');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');
const { exec } = require('child_process');
const { promisify } = require('util');
const ora = require('ora');

const execAsync = promisify(exec);

/**
 * MCP Server Manager - Unified management interface for MCP servers
 */
class MCPServerManager {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.discoveryEngine = new MCPDiscoveryEngine(projectPath);
    this.mcpConfigPath = path.join(projectPath, '.mcp.json');
  }

  /**
   * Main entry point for MCP server management
   */
  async run(options = {}) {
    console.log(chalk.blue('🔌 MCP Server Management System'));
    console.log(chalk.gray(`Project: ${this.projectPath}\n`));

    // Run discovery first
    await this.discoveryEngine.runDiscovery();
    
    return await this.showMainMenu();
  }

  /**
   * Show main management menu
   */
  async showMainMenu() {
    const summary = this.discoveryEngine.getDiscoverySummary();
    
    console.log(chalk.blue('📊 Discovery Summary:'));
    console.log(chalk.gray(`  Total servers found: ${summary.totalServers}`));
    console.log(chalk.gray(`  Installed: ${summary.installedServers}`));
    console.log(chalk.gray(`  Configured: ${summary.configuredServers}`));
    console.log(chalk.gray(`  Categories: ${summary.categories}`));
    console.log(chalk.gray(`  Issues: ${summary.issues}`));
    console.log('');

    const choices = [
      {
        name: '📋 List All Servers - View all discovered MCP servers',
        value: 'list-all',
        short: 'List All'
      },
      {
        name: '🏷️  Browse by Category - Explore servers by category',
        value: 'browse-category',
        short: 'Browse Category'
      },
      {
        name: '⭐ High Priority Servers - View recommended servers',
        value: 'high-priority',
        short: 'High Priority'
      },
      {
        name: '📦 Install Servers - Install new MCP servers',
        value: 'install',
        short: 'Install'
      },
      {
        name: '⚙️  Configure Servers - Manage server configurations',
        value: 'configure',
        short: 'Configure'
      },
      {
        name: '🔍 Search Servers - Search by name or description',
        value: 'search',
        short: 'Search'
      },
      {
        name: '🏥 Health Check - Check server health and issues',
        value: 'health-check',
        short: 'Health Check'
      },
      {
        name: '🛠️  Troubleshoot - Fix server issues',
        value: 'troubleshoot',
        short: 'Troubleshoot'
      },
      {
        name: '📄 Generate Scripts - Create installation/config scripts',
        value: 'generate-scripts',
        short: 'Scripts'
      },
      {
        name: '📊 Detailed Report - View comprehensive analysis',
        value: 'detailed-report',
        short: 'Report'
      }
    ];

    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices,
      pageSize: 12
    }]);

    switch (action) {
      case 'list-all':
        return await this.listAllServers();
      case 'browse-category':
        return await this.browseByCategory();
      case 'high-priority':
        return await this.showHighPriorityServers();
      case 'install':
        return await this.installServers();
      case 'configure':
        return await this.configureServers();
      case 'search':
        return await this.searchServers();
      case 'health-check':
        return await this.runHealthCheck();
      case 'troubleshoot':
        return await this.troubleshootServers();
      case 'generate-scripts':
        return await this.generateScripts();
      case 'detailed-report':
        return await this.showDetailedReport();
      default:
        return;
    }
  }

  /**
   * List all discovered servers
   */
  async listAllServers() {
    console.log(chalk.blue('\n📋 All Discovered MCP Servers\n'));

    const servers = this.discoveryEngine.discoveryResults.analyses;
    
    if (servers.length === 0) {
      console.log(chalk.yellow('No MCP servers found.'));
      return await this.askReturnToMenu();
    }

    // Display servers in a table format
    this.displayServersTable(servers);

    // Ask for detailed view
    const { viewDetails } = await inquirer.prompt([{
      type: 'confirm',
      name: 'viewDetails',
      message: 'Would you like to view details for a specific server?',
      default: false
    }]);

    if (viewDetails) {
      await this.selectAndViewServerDetails(servers);
    }

    return await this.askReturnToMenu();
  }

  /**
   * Browse servers by category
   */
  async browseByCategory() {
    console.log(chalk.blue('\n🏷️  Browse MCP Servers by Category\n'));

    const report = this.discoveryEngine.discoveryResults.report;
    const categories = Object.keys(report.categories);

    if (categories.length === 0) {
      console.log(chalk.yellow('No categories found.'));
      return await this.askReturnToMenu();
    }

    const categoryChoices = categories.map(category => ({
      name: `${category} (${report.categories[category].length} servers)`,
      value: category,
      short: category
    }));

    const { selectedCategory } = await inquirer.prompt([{
      type: 'list',
      name: 'selectedCategory',
      message: 'Select a category to explore:',
      choices: categoryChoices
    }]);

    const categoryServers = this.discoveryEngine.getServersByCategory(selectedCategory);
    
    console.log(chalk.blue(`\n📂 ${selectedCategory.toUpperCase()} Servers\n`));
    this.displayServersTable(categoryServers);

    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: 'View server details', value: 'details' },
        { name: 'Install servers from this category', value: 'install' },
        { name: 'Return to categories', value: 'categories' },
        { name: 'Return to main menu', value: 'menu' }
      ]
    }]);

    switch (action) {
      case 'details':
        await this.selectAndViewServerDetails(categoryServers);
        break;
      case 'install':
        await this.installSelectedServers(categoryServers);
        break;
      case 'categories':
        return await this.browseByCategory();
    }

    return action === 'menu' ? await this.showMainMenu() : await this.askReturnToMenu();
  }

  /**
   * Show high priority servers
   */
  async showHighPriorityServers() {
    console.log(chalk.blue('\n⭐ High Priority MCP Servers\n'));

    const recommendedServers = this.discoveryEngine.getRecommendedServers(10);
    
    if (recommendedServers.length === 0) {
      console.log(chalk.yellow('No high priority servers need installation.'));
      return await this.askReturnToMenu();
    }

    console.log(chalk.green('📦 Recommended for Installation:\n'));
    this.displayServersTable(recommendedServers, { showInstallCommand: true });

    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: 'Install selected servers', value: 'install' },
        { name: 'View server details', value: 'details' },
        { name: 'Generate installation script', value: 'script' },
        { name: 'Return to main menu', value: 'menu' }
      ]
    }]);

    switch (action) {
      case 'install':
        await this.installSelectedServers(recommendedServers);
        break;
      case 'details':
        await this.selectAndViewServerDetails(recommendedServers);
        break;
      case 'script':
        const serverIds = recommendedServers.map(s => s.id);
        await this.generateInstallationScript(serverIds);
        break;
    }

    return action === 'menu' ? await this.showMainMenu() : await this.askReturnToMenu();
  }

  /**
   * Install servers
   */
  async installServers() {
    console.log(chalk.blue('\n📦 Install MCP Servers\n'));

    const availableServers = this.discoveryEngine.getServersByStatus('available');
    
    if (availableServers.length === 0) {
      console.log(chalk.yellow('No servers available for installation.'));
      return await this.askReturnToMenu();
    }

    await this.installSelectedServers(availableServers);
    return await this.askReturnToMenu();
  }

  /**
   * Configure servers
   */
  async configureServers() {
    console.log(chalk.blue('\n⚙️  Configure MCP Servers\n'));

    const installedServers = this.discoveryEngine.getServersByStatus('installed');
    
    if (installedServers.length === 0) {
      console.log(chalk.yellow('No installed servers found to configure.'));
      return await this.askReturnToMenu();
    }

    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: 'Configuration options:',
      choices: [
        { name: 'Add servers to .mcp.json', value: 'add-to-config' },
        { name: 'Edit existing configuration', value: 'edit-config' },
        { name: 'Generate configuration template', value: 'generate-template' },
        { name: 'Validate current configuration', value: 'validate' }
      ]
    }]);

    switch (action) {
      case 'add-to-config':
        await this.addServersToConfig(installedServers);
        break;
      case 'edit-config':
        await this.editConfiguration();
        break;
      case 'generate-template':
        await this.generateConfigurationTemplate(installedServers);
        break;
      case 'validate':
        await this.validateConfiguration();
        break;
    }

    return await this.askReturnToMenu();
  }

  /**
   * Search servers
   */
  async searchServers() {
    console.log(chalk.blue('\n🔍 Search MCP Servers\n'));

    const { query } = await inquirer.prompt([{
      type: 'input',
      name: 'query',
      message: 'Enter search term (name, description, or category):',
      validate: input => input.trim().length > 0 || 'Please enter a search term'
    }]);

    const results = this.discoveryEngine.searchServers(query);
    
    if (results.length === 0) {
      console.log(chalk.yellow(`No servers found matching "${query}"`));
      return await this.searchServers();
    }

    console.log(chalk.green(`\n🎯 Found ${results.length} servers matching "${query}":\n`));
    this.displayServersTable(results);

    await this.selectAndViewServerDetails(results);
    return await this.askReturnToMenu();
  }

  /**
   * Run health check
   */
  async runHealthCheck() {
    console.log(chalk.blue('\n🏥 MCP Server Health Check\n'));

    const problematicServers = this.discoveryEngine.getServersNeedingAttention();
    const installedServers = this.discoveryEngine.getServersByStatus('installed');

    console.log(chalk.blue(`📊 Health Summary:`));
    console.log(chalk.gray(`  Installed servers: ${installedServers.length}`));
    console.log(chalk.gray(`  Servers with issues: ${problematicServers.length}`));
    console.log('');

    if (problematicServers.length > 0) {
      console.log(chalk.red('⚠️  Servers Needing Attention:\n'));
      
      for (const server of problematicServers) {
        console.log(chalk.yellow(`${server.name}:`));
        console.log(chalk.gray(`  Health: ${server.healthStatus} (${server.healthScore}%)`));
        
        if (server.issues.length > 0) {
          console.log(chalk.red('  Issues:'));
          server.issues.forEach(issue => console.log(chalk.red(`    • ${issue}`)));
        }
        
        if (server.recommendations.length > 0) {
          console.log(chalk.blue('  Recommendations:'));
          server.recommendations.forEach(rec => console.log(chalk.blue(`    • ${rec}`)));
        }
        console.log('');
      }
    } else {
      console.log(chalk.green('✅ All servers are healthy!'));
    }

    return await this.askReturnToMenu();
  }

  /**
   * Troubleshoot servers
   */
  async troubleshootServers() {
    console.log(chalk.blue('\n🛠️  Troubleshoot MCP Servers\n'));

    const problematicServers = this.discoveryEngine.getServersNeedingAttention();
    
    if (problematicServers.length === 0) {
      console.log(chalk.green('✅ No servers need troubleshooting!'));
      return await this.askReturnToMenu();
    }

    const serverChoices = problematicServers.map(server => ({
      name: `${server.name} (${server.issues.length} issues)`,
      value: server,
      short: server.name
    }));

    const { selectedServer } = await inquirer.prompt([{
      type: 'list',
      name: 'selectedServer',
      message: 'Select a server to troubleshoot:',
      choices: serverChoices
    }]);

    await this.troubleshootSingleServer(selectedServer);
    return await this.askReturnToMenu();
  }

  /**
   * Generate scripts
   */
  async generateScripts() {
    console.log(chalk.blue('\n📄 Generate Scripts\n'));

    const { scriptType } = await inquirer.prompt([{
      type: 'list',
      name: 'scriptType',
      message: 'What type of script would you like to generate?',
      choices: [
        { name: 'Installation script for recommended servers', value: 'install-recommended' },
        { name: 'Installation script for selected servers', value: 'install-selected' },
        { name: 'Configuration template', value: 'config-template' },
        { name: 'Health check script', value: 'health-check' }
      ]
    }]);

    switch (scriptType) {
      case 'install-recommended':
        const recommendedIds = this.discoveryEngine.getRecommendedServers().map(s => s.id);
        await this.generateInstallationScript(recommendedIds);
        break;
      case 'install-selected':
        await this.selectServersForScript();
        break;
      case 'config-template':
        await this.generateConfigTemplate();
        break;
      case 'health-check':
        await this.generateHealthCheckScript();
        break;
    }

    return await this.askReturnToMenu();
  }

  /**
   * Show detailed report
   */
  async showDetailedReport() {
    console.log(chalk.blue('\n📊 Detailed MCP Discovery Report\n'));

    const report = this.discoveryEngine.discoveryResults.report;
    
    if (!report) {
      console.log(chalk.yellow('No report data available.'));
      return await this.askReturnToMenu();
    }

    // Summary
    console.log(chalk.blue('📈 Summary:'));
    console.log(chalk.gray(`  Total servers: ${report.summary.total}`));
    console.log(chalk.gray(`  Installed: ${report.summary.installed}`));
    console.log(chalk.gray(`  Configured: ${report.summary.configured}`));
    console.log(chalk.gray(`  Running: ${report.summary.running}`));
    console.log(chalk.gray(`  Healthy: ${report.summary.healthy}`));
    console.log('');

    // Categories
    console.log(chalk.blue('🏷️  Categories:'));
    for (const [category, servers] of Object.entries(report.categories)) {
      console.log(chalk.gray(`  ${category}: ${servers.length} servers`));
    }
    console.log('');

    // Top issues
    if (report.issues.length > 0) {
      console.log(chalk.red('⚠️  Top Issues:'));
      report.issues.slice(0, 5).forEach(issue => {
        console.log(chalk.red(`  • ${issue}`));
      });
      console.log('');
    }

    // Top recommendations
    if (report.recommendations.length > 0) {
      console.log(chalk.blue('💡 Top Recommendations:'));
      report.recommendations.slice(0, 5).forEach(rec => {
        console.log(chalk.blue(`  • ${rec}`));
      });
      console.log('');
    }

    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: 'Report actions:',
      choices: [
        { name: 'Save report to file', value: 'save' },
        { name: 'View full markdown report', value: 'markdown' },
        { name: 'Export to JSON', value: 'json' },
        { name: 'Return to main menu', value: 'menu' }
      ]
    }]);

    switch (action) {
      case 'save':
        await this.discoveryEngine.saveDiscoveryResults();
        break;
      case 'markdown':
        const markdown = this.discoveryEngine.generateMarkdownReport();
        console.log('\n' + markdown);
        break;
      case 'json':
        console.log('\n' + JSON.stringify(this.discoveryEngine.discoveryResults, null, 2));
        break;
    }

    return action === 'menu' ? await this.showMainMenu() : await this.askReturnToMenu();
  }

  /**
   * Display servers in table format
   */
  displayServersTable(servers, options = {}) {
    if (servers.length === 0) {
      console.log(chalk.yellow('No servers to display.'));
      return;
    }

    // Calculate column widths
    const maxNameWidth = Math.max(...servers.map(s => s.name.length), 'Server Name'.length);
    const nameWidth = Math.min(maxNameWidth, 25);

    // Header
    const header = chalk.bold.blue(
      'Server Name'.padEnd(nameWidth) + ' │ ' +
      'Category'.padEnd(12) + ' │ ' +
      'Status'.padEnd(10) + ' │ ' +
      'Priority'.padEnd(8) + ' │ ' +
      'Health'.padEnd(8) + ' │ ' +
      'Description'
    );

    const separator = '─'.repeat(nameWidth) + '─┼─' +
      '─'.repeat(12) + '─┼─' +
      '─'.repeat(10) + '─┼─' +
      '─'.repeat(8) + '─┼─' +
      '─'.repeat(8) + '─┼─' +
      '─'.repeat(30);

    console.log(header);
    console.log(chalk.gray(separator));

    // Rows
    servers.forEach((server, index) => {
      if (index >= 20) return; // Limit display

      const truncatedName = server.name.length > nameWidth ? 
        server.name.substring(0, nameWidth - 3) + '...' : 
        server.name;

      const status = server.isInstalled ? chalk.green('Installed') : 
                    server.originalInfo.installCommand ? chalk.yellow('Available') : 
                    chalk.gray('Unknown');

      const priority = server.priority === 'critical' ? chalk.red(server.priority) :
                      server.priority === 'high' ? chalk.yellow(server.priority) :
                      chalk.gray(server.priority);

      const health = server.healthScore > 0 ? 
        (server.healthScore >= 75 ? chalk.green(`${server.healthScore}%`) : 
         server.healthScore >= 50 ? chalk.yellow(`${server.healthScore}%`) : 
         chalk.red(`${server.healthScore}%`)) : 
        chalk.gray('N/A');

      const truncatedDesc = (server.originalInfo.description || 'No description').length > 30 ? 
        (server.originalInfo.description || 'No description').substring(0, 27) + '...' : 
        (server.originalInfo.description || 'No description');

      const row = 
        truncatedName.padEnd(nameWidth) + ' │ ' +
        server.category.padEnd(12) + ' │ ' +
        status.padEnd(10) + ' │ ' +
        priority.padEnd(8) + ' │ ' +
        health.padEnd(8) + ' │ ' +
        chalk.gray(truncatedDesc);

      console.log(row);

      // Show install command if requested
      if (options.showInstallCommand && server.originalInfo.installCommand && !server.isInstalled) {
        console.log(chalk.cyan(`  Install: ${server.originalInfo.installCommand}`));
      }
    });

    if (servers.length > 20) {
      console.log(chalk.gray(`\n... and ${servers.length - 20} more servers`));
    }
  }

  /**
   * Select and view server details
   */
  async selectAndViewServerDetails(servers) {
    const serverChoices = servers.slice(0, 15).map(server => ({
      name: `${server.name} (${server.category})`,
      value: server,
      short: server.name
    }));

    const { selectedServer } = await inquirer.prompt([{
      type: 'list',
      name: 'selectedServer',
      message: 'Select a server to view details:',
      choices: serverChoices
    }]);

    this.displayServerDetails(selectedServer);
  }

  /**
   * Display detailed server information
   */
  displayServerDetails(server) {
    console.log(chalk.blue(`\n📋 ${server.name} - Detailed Information\n`));

    console.log(chalk.bold('Basic Information:'));
    console.log(chalk.gray(`  Category: ${server.category}`));
    console.log(chalk.gray(`  Priority: ${server.priority}`));
    console.log(chalk.gray(`  Complexity: ${server.complexity}/5`));
    console.log(chalk.gray(`  Description: ${server.originalInfo.description || 'No description'}`));
    console.log('');

    console.log(chalk.bold('Status:'));
    console.log(chalk.gray(`  Installed: ${server.isInstalled ? '✅ Yes' : '❌ No'}`));
    console.log(chalk.gray(`  Configured: ${server.isConfigured ? '✅ Yes' : '❌ No'}`));
    console.log(chalk.gray(`  Running: ${server.isRunning ? '✅ Yes' : '❌ No'}`));
    console.log(chalk.gray(`  Health: ${server.healthStatus} (${server.healthScore}%)`));
    console.log('');

    if (server.originalInfo.command) {
      console.log(chalk.bold('Command:'));
      console.log(chalk.cyan(`  ${server.originalInfo.command}`));
      console.log('');
    }

    if (server.originalInfo.installCommand && !server.isInstalled) {
      console.log(chalk.bold('Installation:'));
      console.log(chalk.yellow(`  ${server.originalInfo.installCommand}`));
      console.log('');
    }

    if (server.capabilities && (server.capabilities.tools.length > 0 || server.capabilities.resources.length > 0)) {
      console.log(chalk.bold('Capabilities:'));
      if (server.capabilities.tools.length > 0) {
        console.log(chalk.gray(`  Tools: ${server.capabilities.tools.join(', ')}`));
      }
      if (server.capabilities.resources.length > 0) {
        console.log(chalk.gray(`  Resources: ${server.capabilities.resources.join(', ')}`));
      }
      console.log('');
    }

    if (server.issues.length > 0) {
      console.log(chalk.red('Issues:'));
      server.issues.forEach(issue => console.log(chalk.red(`  • ${issue}`)));
      console.log('');
    }

    if (server.recommendations.length > 0) {
      console.log(chalk.blue('Recommendations:'));
      server.recommendations.forEach(rec => console.log(chalk.blue(`  • ${rec}`)));
      console.log('');
    }
  }

  /**
   * Install selected servers
   */
  async installSelectedServers(availableServers) {
    const installableServers = availableServers.filter(s => 
      !s.isInstalled && s.originalInfo.installCommand
    );

    if (installableServers.length === 0) {
      console.log(chalk.yellow('No servers available for installation.'));
      return;
    }

    const choices = installableServers.map(server => ({
      name: `${server.name} - ${server.originalInfo.description || 'No description'}`,
      value: server,
      checked: server.priority === 'critical' || server.priority === 'high'
    }));

    const { selectedServers } = await inquirer.prompt([{
      type: 'checkbox',
      name: 'selectedServers',
      message: 'Select servers to install:',
      choices,
      validate: input => input.length > 0 || 'Please select at least one server'
    }]);

    if (selectedServers.length === 0) {
      return;
    }

    console.log(chalk.blue(`\n📦 Installing ${selectedServers.length} servers...\n`));

    for (const server of selectedServers) {
      const spinner = ora(`Installing ${server.name}...`).start();
      
      try {
        await execAsync(server.originalInfo.installCommand);
        spinner.succeed(`✅ ${server.name} installed successfully`);
      } catch (error) {
        spinner.fail(`❌ Failed to install ${server.name}: ${error.message}`);
      }
    }

    console.log(chalk.green('\n📦 Installation process completed!'));
    console.log(chalk.blue('💡 Tip: Run discovery again to see updated server status.'));
  }

  /**
   * Generate installation script
   */
  async generateInstallationScript(serverIds) {
    const scriptData = this.discoveryEngine.generateInstallationScript(serverIds, 'bash');
    
    if (!scriptData) {
      console.log(chalk.yellow('No servers selected or no installation commands available.'));
      return;
    }

    const scriptPath = path.join(this.projectPath, 'install-mcp-servers.sh');
    await fs.writeFile(scriptPath, scriptData.script, 'utf8');
    await fs.chmod(scriptPath, '755'); // Make executable

    console.log(chalk.green(`\n📄 Installation script generated: ${scriptPath}`));
    console.log(chalk.blue('🏃 Run with: ./install-mcp-servers.sh'));
    console.log(chalk.gray('\nScript will install:'));
    
    scriptData.servers.forEach(server => {
      console.log(chalk.gray(`  • ${server.name}: ${server.command}`));
    });
  }

  /**
   * Ask to return to main menu
   */
  async askReturnToMenu() {
    const { returnToMenu } = await inquirer.prompt([{
      type: 'confirm',
      name: 'returnToMenu',
      message: 'Return to main menu?',
      default: true
    }]);

    if (returnToMenu) {
      return await this.showMainMenu();
    }
  }

  /**
   * Add servers to MCP configuration
   */
  async addServersToConfig(installedServers) {
    const configServers = installedServers.filter(s => !s.isConfigured);
    
    if (configServers.length === 0) {
      console.log(chalk.yellow('All installed servers are already configured.'));
      return;
    }

    const choices = configServers.map(server => ({
      name: `${server.name} (${server.category})`,
      value: server,
      checked: true
    }));

    const { selectedServers } = await inquirer.prompt([{
      type: 'checkbox',
      name: 'selectedServers',
      message: 'Select servers to add to .mcp.json:',
      choices
    }]);

    if (selectedServers.length === 0) {
      return;
    }

    const serverIds = selectedServers.map(s => s.id);
    const configTemplate = this.discoveryEngine.generateConfigurationTemplate(serverIds);
    
    // Load or create .mcp.json
    let existingConfig = { mcpServers: {} };
    if (await fs.pathExists(this.mcpConfigPath)) {
      try {
        existingConfig = await fs.readJSON(this.mcpConfigPath);
      } catch (error) {
        console.warn(chalk.yellow('Warning: Could not parse existing .mcp.json'));
      }
    }

    // Merge configurations
    Object.assign(existingConfig.mcpServers, configTemplate.config.mcpServers);

    // Save configuration
    await fs.writeJSON(this.mcpConfigPath, existingConfig, { spaces: 2 });
    
    console.log(chalk.green(`\n✅ Added ${selectedServers.length} servers to .mcp.json`));
    console.log(chalk.blue(`📁 Configuration saved to: ${this.mcpConfigPath}`));
    
    // Show any environment variables that need to be set
    const envVarsNeeded = [];
    for (const server of selectedServers) {
      if (server.dependencies && server.dependencies.environment.length > 0) {
        envVarsNeeded.push(...server.dependencies.environment.map(env => ({ server: server.name, var: env })));
      }
    }

    if (envVarsNeeded.length > 0) {
      console.log(chalk.yellow('\n⚠️  Environment variables needed:'));
      envVarsNeeded.forEach(({ server, var: envVar }) => {
        console.log(chalk.yellow(`  ${server}: ${envVar}`));
      });
    }
  }

  /**
   * Troubleshoot single server
   */
  async troubleshootSingleServer(server) {
    console.log(chalk.blue(`\n🛠️  Troubleshooting ${server.name}\n`));

    console.log(chalk.red('Issues Found:'));
    server.issues.forEach(issue => console.log(chalk.red(`  • ${issue}`)));
    console.log('');

    console.log(chalk.blue('Recommended Actions:'));
    server.recommendations.forEach(rec => console.log(chalk.blue(`  • ${rec}`)));
    console.log('');

    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: 'Try automatic fix', value: 'auto-fix' },
        { name: 'Reinstall server', value: 'reinstall' },
        { name: 'View detailed configuration', value: 'config' },
        { name: 'Skip this server', value: 'skip' }
      ]
    }]);

    switch (action) {
      case 'auto-fix':
        await this.attemptAutoFix(server);
        break;
      case 'reinstall':
        if (server.originalInfo.installCommand) {
          await this.reinstallServer(server);
        } else {
          console.log(chalk.yellow('No installation command available for this server.'));
        }
        break;
      case 'config':
        this.displayServerDetails(server);
        break;
    }
  }

  /**
   * Attempt automatic fix for server issues
   */
  async attemptAutoFix(server) {
    console.log(chalk.blue(`🔧 Attempting automatic fix for ${server.name}...`));

    const fixes = [];

    // Check for missing dependencies
    if (server.dependencies) {
      for (const runtime of server.dependencies.runtime) {
        try {
          await execAsync(`which ${runtime}`);
        } catch (error) {
          fixes.push(`Install ${runtime} runtime`);
        }
      }
    }

    // Check for missing environment variables
    if (server.dependencies && server.dependencies.environment.length > 0) {
      for (const envVar of server.dependencies.environment) {
        if (!process.env[envVar]) {
          fixes.push(`Set environment variable: ${envVar}`);
        }
      }
    }

    if (fixes.length === 0) {
      console.log(chalk.green('✅ No automatic fixes available or server is already healthy.'));
    } else {
      console.log(chalk.yellow('⚠️  Manual intervention required:'));
      fixes.forEach(fix => console.log(chalk.yellow(`  • ${fix}`)));
    }
  }

  /**
   * Reinstall server
   */
  async reinstallServer(server) {
    const spinner = ora(`Reinstalling ${server.name}...`).start();
    
    try {
      await execAsync(server.originalInfo.installCommand);
      spinner.succeed(`✅ ${server.name} reinstalled successfully`);
    } catch (error) {
      spinner.fail(`❌ Failed to reinstall ${server.name}: ${error.message}`);
    }
  }
}

module.exports = MCPServerManager;