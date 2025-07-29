#!/usr/bin/env node

/**
 * AI Agent Ecosystem Demo Script
 * Demonstrates the Claude Code SDK integration with specialized AI agents
 */

const path = require('path');
const chalk = require('chalk');
const { AIAgentManager } = require('./index');

async function runDemo() {
  console.log(chalk.magenta('🤖 AI Agent Ecosystem Demo'));
  console.log(chalk.gray('Testing Claude Code SDK integration with specialized AI agents\n'));

  const demoProjectPath = process.cwd();
  
  try {
    // Initialize AI Agent Manager
    console.log(chalk.blue('🔧 Initializing AI Agent Manager...'));
    const agentManager = new AIAgentManager(demoProjectPath);
    
    const initialized = await agentManager.initializeAgents();
    
    if (!initialized) {
      console.log(chalk.red('❌ Failed to initialize AI agents'));
      console.log(chalk.yellow('💡 Make sure Claude Code is set up:'));
      console.log(chalk.gray('   1. npm install -g @anthropic-ai/claude-code'));
      console.log(chalk.gray('   2. claude login'));
      console.log(chalk.gray('   3. claude auth status'));
      return;
    }

    console.log(chalk.green('✅ AI agents initialized successfully!\n'));

    // Display agent status
    const statuses = agentManager.getAgentStatuses();
    console.log(chalk.blue('📊 Agent Status:'));
    for (const [agentType, status] of Object.entries(statuses)) {
      const icon = status.initialized ? '✅' : '❌';
      console.log(chalk.gray(`   ${icon} ${agentType} Agent - Ready`));
    }

    console.log(chalk.yellow('\n🚀 Demo Features Available:'));
    console.log(chalk.gray('   📋 Code Review Agent - Analyzes security and best practices'));
    console.log(chalk.gray('   ⚡ Optimization Agent - Identifies performance improvements'));
    console.log(chalk.gray('   📝 Documentation Agent - Generates comprehensive docs'));
    console.log(chalk.gray('   🔧 Comprehensive Analysis - Runs all agents together'));

    console.log(chalk.cyan('\n💡 Try these commands:'));
    console.log(chalk.white('   claude-code-config --ai-agents'));
    console.log(chalk.white('   claude-code-config --agent-review'));
    console.log(chalk.white('   claude-code-config --agent-optimize'));
    console.log(chalk.white('   claude-code-config --agent-docs'));
    console.log(chalk.white('   claude-code-config --agent-comprehensive'));

    console.log(chalk.green('\n🎉 AI Agent Ecosystem is ready for use!'));
    
    // Cleanup
    await agentManager.cleanup();
    
  } catch (error) {
    console.error(chalk.red('❌ Demo failed:'), error.message);
    
    if (error.message.includes('Claude Code')) {
      console.log(chalk.yellow('\n💡 Setup Instructions:'));
      console.log(chalk.gray('1. Install Claude Code: npm install -g @anthropic-ai/claude-code'));
      console.log(chalk.gray('2. Authenticate: claude login'));
      console.log(chalk.gray('3. Verify setup: claude auth status'));
    }
  }
}

if (require.main === module) {
  runDemo().catch(console.error);
}

module.exports = { runDemo };