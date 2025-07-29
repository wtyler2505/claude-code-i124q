const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const ora = require('ora');
const { detectProject } = require('./utils');
const { getTemplateConfig, TEMPLATES_CONFIG } = require('./templates');
const { createPrompts, interactivePrompts } = require('./prompts');
const { copyTemplateFiles, runPostInstallationValidation } = require('./file-operations');
const { getHooksForLanguage, getMCPsForLanguage } = require('./hook-scanner');
const { installAgents } = require('./agents');
const { runCommandStats } = require('./command-stats');
const { runHookStats } = require('./hook-stats');
const { runMCPStats } = require('./mcp-stats');
const { runAnalytics } = require('./analytics');
const { runHealthCheck } = require('./health-check');
const { AIAgentManager } = require('./ai-agents');
const { MCPServerManager } = require('./mcp-discovery');

async function showMainMenu() {
  console.log('');
  
  const initialChoice = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: 'What would you like to do?',
    choices: [
      {
        name: '🤖 AI Agents - Code review, optimization, and documentation with AI',
        value: 'ai-agents',
        short: 'AI Agents'
      },
      {
        name: '🔌 MCP Discovery - Intelligent MCP server discovery and management',
        value: 'mcp-discovery',
        short: 'MCP Discovery'
      },
      {
        name: '📊 Analytics Dashboard - Monitor your Claude Code usage and sessions',
        value: 'analytics',
        short: 'Analytics Dashboard'
      },
      {
        name: '💬 Chats Dashboard - View and analyze your Claude conversations',
        value: 'chats',
        short: 'Chats Dashboard'
      },
      {
        name: '⚙️ Project Setup - Configure Claude Code for your project',
        value: 'setup',
        short: 'Project Setup'
      },
      {
        name: '🔍 Health Check - Verify your Claude Code setup and configuration',
        value: 'health',
        short: 'Health Check'
      }
    ],
    default: 'analytics'
  }]);
  
  if (initialChoice.action === 'ai-agents') {
    console.log(chalk.magenta('🤖 Launching AI Agent Ecosystem...'));
    return await runAIAgents({});
  }
  
  if (initialChoice.action === 'analytics') {
    console.log(chalk.blue('📊 Launching Claude Code Analytics Dashboard...'));
    await runAnalytics({});
    return;
  }
  
  if (initialChoice.action === 'chats') {
    console.log(chalk.blue('💬 Launching Claude Code Chats Dashboard...'));
    await runAnalytics({ openTo: 'agents' });
    return;
  }
  
  if (initialChoice.action === 'health') {
    console.log(chalk.blue('🔍 Running Health Check...'));
    const healthResult = await runHealthCheck();
    if (healthResult.runSetup) {
      console.log(chalk.blue('⚙️  Starting Project Setup...'));
      // Continue with setup flow
      return await createClaudeConfig({});
    } else {
      console.log(chalk.green('👍 Health check completed. Returning to main menu...'));
      return await showMainMenu();
    }
  }
  
  // Continue with setup if user chose 'setup'
  console.log(chalk.blue('⚙️  Setting up Claude Code configuration...'));
  return await createClaudeConfig({ setupFromMenu: true });
}

async function runAIAgents(options = {}) {
  const targetDir = options.directory || process.cwd();
  
  console.log(chalk.magenta('🤖 Welcome to the AI Agent Ecosystem!'));
  console.log(chalk.gray('Powered by Claude Code SDK for advanced project analysis\n'));
  
  // Initialize AI Agent Manager
  const agentManager = new AIAgentManager(targetDir);
  const initialized = await agentManager.initializeAgents();
  
  if (!initialized) {
    console.log(chalk.red('❌ Failed to initialize AI agents. Please check your Claude Code setup.'));
    console.log(chalk.yellow('💡 Run: claude auth status'));
    return;
  }
  
  // Show AI agent menu
  const agentChoice = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: 'Which AI analysis would you like to run?',
    choices: [
      {
        name: '🔍 Code Review - Security, best practices, and architecture analysis',
        value: 'code-review',
        short: 'Code Review'
      },
      {
        name: '⚡ Performance Optimization - Speed and efficiency improvements',
        value: 'optimization', 
        short: 'Optimization'
      },
      {
        name: '📝 Documentation Generation - Comprehensive project documentation',
        value: 'documentation',
        short: 'Documentation'
      },
      {
        name: '🚀 Comprehensive Analysis - Run all AI agents (recommended)',
        value: 'comprehensive',
        short: 'Comprehensive Analysis'
      },
      {
        name: '📊 View Previous Reports - Browse past AI analysis reports',
        value: 'reports',
        short: 'View Reports'
      },
      {
        name: '⚙️ Agent Settings - Configure AI agent behavior',
        value: 'settings',
        short: 'Settings'
      }
    ],
    default: 'comprehensive'
  }]);

  try {
    switch (agentChoice.action) {
      case 'code-review':
        await runCodeReviewFlow(agentManager, options);
        break;
      case 'optimization':
        await runOptimizationFlow(agentManager, options);
        break;
      case 'documentation':
        await runDocumentationFlow(agentManager, options);
        break;
      case 'comprehensive':
        await runComprehensiveFlow(agentManager, options);
        break;
      case 'reports':
        await viewPreviousReports(targetDir);
        break;
      case 'settings':
        await configureAgentSettings(agentManager);
        break;
    }
  } catch (error) {
    console.error(chalk.red('❌ AI Agent analysis failed:'), error.message);
  } finally {
    // Cleanup
    await agentManager.cleanup();
  }
}

async function runCodeReviewFlow(agentManager, options) {
  console.log(chalk.blue('\n🔍 Code Review Agent Configuration'));
  
  const reviewOptions = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'projectReview',
      message: 'Perform comprehensive project review?',
      default: true
    },
    {
      type: 'confirm',
      name: 'securityAnalysis',
      message: 'Include security vulnerability analysis?',
      default: true
    },
    {
      type: 'input',
      name: 'specificFiles',
      message: 'Specific files to review (comma-separated, leave empty for all):',
      default: ''
    }
  ]);

  const files = reviewOptions.specificFiles 
    ? reviewOptions.specificFiles.split(',').map(f => f.trim()).filter(f => f)
    : [];

  const results = await agentManager.runCodeReview({
    projectReview: reviewOptions.projectReview,
    securityAnalysis: reviewOptions.securityAnalysis,
    files: files.length > 0 ? files : undefined
  });

  console.log(chalk.green('\n✅ Code Review completed!'));
  console.log(chalk.blue(`📋 Report saved: ${results.reportPath}`));
}

async function runOptimizationFlow(agentManager, options) {
  console.log(chalk.yellow('\n⚡ Performance Optimization Agent Configuration'));
  
  const optimizationOptions = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'projectAnalysis',
      message: 'Analyze entire project for optimization opportunities?',
      default: true
    },
    {
      type: 'confirm',
      name: 'frontendAnalysis',
      message: 'Include frontend performance analysis?',
      default: true
    },
    {
      type: 'confirm',
      name: 'strategy',
      message: 'Generate optimization strategy roadmap?',
      default: true
    },
    {
      type: 'list',
      name: 'projectType',
      message: 'What type of project is this?',
      choices: [
        'web-application',
        'api-service',
        'mobile-app',
        'desktop-app',
        'library',
        'microservice'
      ],
      default: 'web-application'
    }
  ]);

  const results = await agentManager.runCodeOptimization({
    projectAnalysis: optimizationOptions.projectAnalysis,
    frontendAnalysis: optimizationOptions.frontendAnalysis,
    strategy: optimizationOptions.strategy,
    projectType: optimizationOptions.projectType
  });

  console.log(chalk.green('\n✅ Performance Optimization analysis completed!'));
  console.log(chalk.blue(`📋 Report saved: ${results.reportPath}`));
}

async function runDocumentationFlow(agentManager, options) {
  console.log(chalk.cyan('\n📝 Documentation Agent Configuration'));
  
  const docOptions = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'documentTypes',
      message: 'Select documentation to generate:',
      choices: [
        { name: 'README.md - Project overview and setup', value: 'readme', checked: true },
        { name: 'API Documentation - Endpoints and usage', value: 'api', checked: true },
        { name: 'Architecture Documentation - System design', value: 'architecture', checked: true },
        { name: 'Contributing Guidelines - Development process', value: 'contributing', checked: true },
        { name: 'User Guide - Tutorial and usage examples', value: 'userGuide', checked: false },
        { name: 'Changelog Template - Version history format', value: 'changelog', checked: false }
      ]
    },
    {
      type: 'confirm',
      name: 'writeFiles',
      message: 'Write documentation files to project directory?',
      default: true
    }
  ]);

  const docConfig = {
    writeFiles: docOptions.writeFiles,
    readme: docOptions.documentTypes.includes('readme'),
    architecture: docOptions.documentTypes.includes('architecture'),
    contributing: docOptions.documentTypes.includes('contributing'),
    userGuide: docOptions.documentTypes.includes('userGuide'),
    changelog: docOptions.documentTypes.includes('changelog')
  };

  const results = await agentManager.runDocumentationGeneration(docConfig);

  console.log(chalk.green('\n✅ Documentation generation completed!'));
  console.log(chalk.blue(`📋 Report saved: ${results.reportPath}`));
  
  if (docOptions.writeFiles) {
    console.log(chalk.green('📄 Documentation files written to project directory'));
  }
}

async function runComprehensiveFlow(agentManager, options) {
  console.log(chalk.magenta('\n🚀 Comprehensive AI Analysis Configuration'));
  
  const comprehensiveOptions = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'codeReview',
      message: 'Include Code Review analysis?',
      default: true
    },
    {
      type: 'confirm',
      name: 'optimization',
      message: 'Include Performance Optimization analysis?',
      default: true
    },
    {
      type: 'confirm',
      name: 'documentation',
      message: 'Include Documentation generation?',
      default: true
    },
    {
      type: 'confirm',
      name: 'writeFiles',
      message: 'Write generated documentation files to project?',
      default: true
    }
  ]);

  const results = await agentManager.runComprehensiveAnalysis({
    codeReview: comprehensiveOptions.codeReview,
    optimization: comprehensiveOptions.optimization,
    documentation: comprehensiveOptions.documentation,
    writeFiles: comprehensiveOptions.writeFiles
  });

  console.log(chalk.green('\n🎉 Comprehensive AI Analysis completed!'));
  console.log(chalk.blue(`📊 Comprehensive report: ${results.comprehensiveReport}`));
}

async function viewPreviousReports(projectPath) {
  const reportsDir = path.join(projectPath, '.claude', 'agents', 'reports');
  
  if (!(await fs.pathExists(reportsDir))) {
    console.log(chalk.yellow('📭 No previous reports found. Run an AI analysis first.'));
    return;
  }

  const reportFiles = await fs.readdir(reportsDir);
  const reports = reportFiles.filter(f => f.endsWith('.json'));

  if (reports.length === 0) {
    console.log(chalk.yellow('📭 No previous reports found.'));
    return;
  }

  console.log(chalk.blue(`\n📊 Found ${reports.length} previous reports:`));
  reports.forEach((report, index) => {
    console.log(chalk.gray(`  ${index + 1}. ${report}`));
  });

  const reportChoice = await inquirer.prompt([{
    type: 'list',
    name: 'report',
    message: 'Select a report to view:',
    choices: reports.map(r => ({ name: r, value: r }))
  }]);

  const reportPath = path.join(reportsDir, reportChoice.report);
  const reportData = await fs.readJSON(reportPath);
  
  console.log(chalk.blue(`\n📋 Report: ${reportChoice.report}`));
  console.log(chalk.gray(`Generated: ${new Date(reportData.timestamp).toLocaleString()}`));
  console.log(chalk.gray(`Summary: ${reportData.summary}`));
  console.log(chalk.blue(`Full report: ${reportPath}`));
}

async function configureAgentSettings(agentManager) {
  console.log(chalk.blue('\n⚙️ AI Agent Settings'));
  console.log(chalk.gray('Current implementation uses Claude Code SDK defaults.'));
  console.log(chalk.yellow('💡 Advanced settings will be available in future versions.'));
  
  const agentStatuses = agentManager.getAgentStatuses();
  
  console.log(chalk.blue('\n🤖 Agent Status:'));
  for (const [agentType, status] of Object.entries(agentStatuses)) {
    const statusIcon = status.initialized ? '✅' : '❌';
    console.log(chalk.gray(`  ${statusIcon} ${agentType}: ${status.conversationCount} conversations`));
  }
}

async function createClaudeConfig(options = {}) {
  const targetDir = options.directory || process.cwd();
  
  // Handle command stats analysis (both singular and plural)
  if (options.commandStats || options.commandsStats) {
    await runCommandStats(options);
    return;
  }
  
  // Handle hook stats analysis (both singular and plural)
  if (options.hookStats || options.hooksStats) {
    await runHookStats(options);
    return;
  }
  
  // Handle MCP stats analysis (both singular and plural)
  if (options.mcpStats || options.mcpsStats) {
    await runMCPStats(options);
    return;
  }
  
  // Handle analytics dashboard
  if (options.analytics) {
    await runAnalytics(options);
    return;
  }
  
  // Handle chats/agents dashboard
  if (options.chats || options.agents) {
    await runAnalytics({ ...options, openTo: 'agents' });
    return;
  }
  
  // Handle AI agents
  if (options.aiAgents || options.agentsAi) {
    await runAIAgents(options);
    return;
  }
  
  // Handle specific AI agent options
  if (options.agentReview) {
    const agentManager = new AIAgentManager(targetDir);
    const initialized = await agentManager.initializeAgents();
    if (initialized) {
      await agentManager.runCodeReview({ projectReview: true, securityAnalysis: true });
      await agentManager.cleanup();
    }
    return;
  }
  
  if (options.agentOptimize) {
    const agentManager = new AIAgentManager(targetDir);
    const initialized = await agentManager.initializeAgents();
    if (initialized) {
      await agentManager.runCodeOptimization({ projectAnalysis: true, strategy: true });
      await agentManager.cleanup();
    }
    return;
  }
  
  if (options.agentDocs) {
    const agentManager = new AIAgentManager(targetDir);
    const initialized = await agentManager.initializeAgents();
    if (initialized) {
      await agentManager.runDocumentationGeneration({ readme: true, architecture: true, writeFiles: true });
      await agentManager.cleanup();
    }
    return;
  }
  
  if (options.agentComprehensive) {
    const agentManager = new AIAgentManager(targetDir);
    const initialized = await agentManager.initializeAgents();
    if (initialized) {
      await agentManager.runComprehensiveAnalysis({ writeFiles: true });
      await agentManager.cleanup();
    }
    return;
  }
  
  // Handle health check
  let shouldRunSetup = false;
  if (options.healthCheck || options.health || options.check || options.verify) {
    const healthResult = await runHealthCheck();
    if (healthResult.runSetup) {
      console.log(chalk.blue('⚙️  Starting Project Setup...'));
      shouldRunSetup = true;
    } else {
      console.log(chalk.green('👍 Health check completed. Returning to main menu...'));
      return await showMainMenu();
    }
  }
  
  // Add initial choice prompt (only if no specific options are provided and not continuing from health check or menu)
  if (!shouldRunSetup && !options.setupFromMenu && !options.yes && !options.language && !options.framework && !options.dryRun) {
    return await showMainMenu();
  } else {
    console.log(chalk.blue('🚀 Setting up Claude Code configuration...'));
  }
  
  console.log(chalk.gray(`Target directory: ${targetDir}`));
  
  // Detect existing project
  const spinner = ora('Detecting project type...').start();
  const projectInfo = await detectProject(targetDir);
  spinner.succeed('Project detection complete');
  
  let config;
  if (options.yes) {
    // Use defaults
    const selectedLanguage = options.language || projectInfo.detectedLanguage || 'common';
    
    // Check if selected language is coming soon
    if (selectedLanguage && TEMPLATES_CONFIG[selectedLanguage] && TEMPLATES_CONFIG[selectedLanguage].comingSoon) {
      console.log(chalk.red(`❌ ${selectedLanguage} is not available yet. Coming soon!`));
      console.log(chalk.yellow('Available languages: common, javascript-typescript, python'));
      return;
    }
    const availableHooks = getHooksForLanguage(selectedLanguage);
    const defaultHooks = availableHooks.filter(hook => hook.checked).map(hook => hook.id);
    const availableMCPs = getMCPsForLanguage(selectedLanguage);
    const defaultMCPs = availableMCPs.filter(mcp => mcp.checked).map(mcp => mcp.id);
    
    config = {
      language: selectedLanguage,
      framework: options.framework || projectInfo.detectedFramework || 'none',
      features: [],
      hooks: defaultHooks,
      mcps: defaultMCPs
    };
  } else {
    // Interactive prompts with back navigation
    config = await interactivePrompts(projectInfo, options);
  }
  
  // Check if user confirmed the setup
  if (config.confirm === false) {
    console.log(chalk.yellow('⏹️  Setup cancelled by user.'));
    return;
  }

  // Handle analytics option from onboarding
  if (config.analytics) {
    console.log(chalk.blue('📊 Launching Claude Code Analytics Dashboard...'));
    await runAnalytics(options);
    return;
  }
  
  // Get template configuration
  const templateConfig = getTemplateConfig(config);
  
  // Add selected hooks to template config
  if (config.hooks) {
    templateConfig.selectedHooks = config.hooks;
    templateConfig.language = config.language; // Ensure language is available for hook filtering
  }
  
  // Add selected MCPs to template config
  if (config.mcps) {
    templateConfig.selectedMCPs = config.mcps;
    templateConfig.language = config.language; // Ensure language is available for MCP filtering
  }
  
  // Install selected agents
  if (config.agents && config.agents.length > 0) {
    console.log(chalk.blue('🤖 Installing Claude Code agents...'));
    await installAgents(config.agents, targetDir);
  }
  
  if (options.dryRun) {
    console.log(chalk.yellow('🔍 Dry run - showing what would be copied:'));
    templateConfig.files.forEach(file => {
      console.log(chalk.gray(`  - ${file.source} → ${file.destination}`));
    });
    return;
  }
  
  // Copy template files
  const copySpinner = ora('Copying template files...').start();
  try {
    const result = await copyTemplateFiles(templateConfig, targetDir, options);
    if (result === false) {
      copySpinner.info('Setup cancelled by user');
      return; // Exit early if user cancelled
    }
    copySpinner.succeed('Template files copied successfully');
  } catch (error) {
    copySpinner.fail('Failed to copy template files');
    throw error;
  }
  
  // Show success message
  console.log(chalk.green('✅ Claude Code configuration setup complete!'));
  console.log(chalk.cyan('📚 Next steps:'));
  console.log(chalk.white('  1. Review the generated CLAUDE.md file'));
  console.log(chalk.white('  2. Customize the configuration for your project'));
  console.log(chalk.white('  3. Start using Claude Code with: claude'));
  console.log('');
  console.log(chalk.blue('🌐 View all available templates at: https://davila7.github.io/claude-code-templates/'));
  console.log(chalk.blue('📖 Read the complete documentation at: https://davila7.github.io/claude-code-templates/docu/'));
  
  if (config.language !== 'common') {
    console.log(chalk.yellow(`💡 Language-specific features for ${config.language} have been configured`));
  }
  
  if (config.framework !== 'none') {
    console.log(chalk.yellow(`🎯 Framework-specific commands for ${config.framework} are available`));
  }
  
  if (config.hooks && config.hooks.length > 0) {
    console.log(chalk.magenta(`🔧 ${config.hooks.length} automation hooks have been configured`));
  }
  
  if (config.mcps && config.mcps.length > 0) {
    console.log(chalk.blue(`🔧 ${config.mcps.length} MCP servers have been configured`));
  }
  
  // Run post-installation validation
  if (!options.dryRun) {
    await runPostInstallationValidation(targetDir, templateConfig);
  }
}

module.exports = { createClaudeConfig, showMainMenu, runAIAgents };