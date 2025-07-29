const { ClaudeCode } = require('@anthropic-ai/claude-code');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');

/**
 * Base ClaudeAgent class for managing Claude Code SDK integration
 * Provides session management, conversation handling, and specialized agent capabilities
 */
class ClaudeAgent {
  constructor(agentType, systemPrompt, options = {}) {
    this.agentType = agentType;
    this.systemPrompt = systemPrompt;
    this.options = options;
    this.client = null;
    this.session = null;
    this.conversationHistory = [];
    this.sessionId = this.generateSessionId();
  }

  /**
   * Initialize the Claude Code client and create a new session
   */
  async initialize() {
    try {
      this.client = new ClaudeCode();
      this.session = this.client.newSession();
      console.log(chalk.blue(`🤖 Initializing ${this.agentType} Agent...`));
      return true;
    } catch (error) {
      console.error(chalk.red(`❌ Failed to initialize ${this.agentType} Agent:`), error.message);
      return false;
    }
  }

  /**
   * Send a prompt to the agent with context
   */
  async sendPrompt(prompt, additionalContext = {}) {
    if (!this.session) {
      throw new Error(`${this.agentType} Agent not initialized. Call initialize() first.`);
    }

    const spinner = ora(`${this.agentType} Agent is analyzing...`).start();

    try {
      const response = await this.session.prompt({
        prompt: prompt,
        systemPrompt: this.systemPrompt,
        ...additionalContext
      });

      // Store conversation history
      this.conversationHistory.push({
        timestamp: new Date().toISOString(),
        prompt: prompt,
        response: response,
        context: additionalContext
      });

      spinner.succeed(`${this.agentType} Agent completed analysis`);
      return response;
    } catch (error) {
      spinner.fail(`${this.agentType} Agent analysis failed`);
      throw error;
    }
  }

  /**
   * Continue a multi-turn conversation
   */
  async continueConversation(followUpPrompt) {
    return await this.sendPrompt(followUpPrompt);
  }

  /**
   * Get conversation history
   */
  getConversationHistory() {
    return this.conversationHistory;
  }

  /**
   * Save conversation to file
   */
  async saveConversation(projectPath) {
    const agentsDir = path.join(projectPath, '.claude', 'agents', 'conversations');
    await fs.ensureDir(agentsDir);
    
    const filename = `${this.agentType.toLowerCase()}-${this.sessionId}.json`;
    const filepath = path.join(agentsDir, filename);
    
    const conversationData = {
      agentType: this.agentType,
      sessionId: this.sessionId,
      systemPrompt: this.systemPrompt,
      history: this.conversationHistory,
      createdAt: new Date().toISOString()
    };

    await fs.writeJSON(filepath, conversationData, { spaces: 2 });
    console.log(chalk.green(`💾 Conversation saved to ${filepath}`));
    return filepath;
  }

  /**
   * Load previous conversation
   */
  async loadConversation(filepath) {
    try {
      const conversationData = await fs.readJSON(filepath);
      this.conversationHistory = conversationData.history || [];
      this.sessionId = conversationData.sessionId;
      console.log(chalk.blue(`📁 Loaded conversation from ${filepath}`));
      return true;
    } catch (error) {
      console.error(chalk.yellow(`⚠️  Could not load conversation: ${error.message}`));
      return false;
    }
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get agent status
   */
  getStatus() {
    return {
      agentType: this.agentType,
      sessionId: this.sessionId,
      initialized: !!this.session,
      conversationCount: this.conversationHistory.length,
      lastActivity: this.conversationHistory.length > 0 
        ? this.conversationHistory[this.conversationHistory.length - 1].timestamp 
        : null
    };
  }

  /**
   * Cleanup agent resources
   */
  async cleanup() {
    if (this.session) {
      // Note: Claude Code SDK may not have explicit cleanup methods
      // This is a placeholder for any necessary cleanup
      this.session = null;
    }
    this.client = null;
    console.log(chalk.gray(`🧹 ${this.agentType} Agent cleaned up`));
  }
}

module.exports = ClaudeAgent;