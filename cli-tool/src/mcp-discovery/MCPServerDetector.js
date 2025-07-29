const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const { promisify } = require('util');
const chalk = require('chalk');

const execAsync = promisify(exec);

/**
 * MCP Server Detector - Comprehensive detection of MCP servers in various locations
 */
class MCPServerDetector {
  constructor() {
    this.detectionResults = {
      global: [],
      project: [],
      workspace: [],
      systemPackages: [],
      discovered: []
    };
  }

  /**
   * Comprehensive detection of all MCP servers
   */
  async detectAllMCPServers(projectPath = process.cwd()) {
    console.log(chalk.blue('🔍 Starting comprehensive MCP server detection...'));
    
    const detectionTasks = [
      this.detectGlobalMCPServers(),
      this.detectProjectMCPServers(projectPath),
      this.detectWorkspaceMCPServers(projectPath),
      this.detectSystemPackageMCPs(),
      this.discoverAvailableMCPs()
    ];

    try {
      await Promise.all(detectionTasks);
      console.log(chalk.green('✅ MCP server detection completed'));
      return this.detectionResults;
    } catch (error) {
      console.error(chalk.red('❌ Error during MCP detection:'), error.message);
      return this.detectionResults;
    }
  }

  /**
   * Detect globally installed MCP servers
   */
  async detectGlobalMCPServers() {
    console.log(chalk.gray('📡 Scanning global MCP servers...'));
    
    try {
      // Check npm global packages for MCP servers
      const npmGlobalMCPs = await this.scanNpmGlobalMCPs();
      this.detectionResults.global.push(...npmGlobalMCPs);

      // Check system-wide Claude Code configurations
      const systemClaudeMCPs = await this.scanSystemClaudeConfigs();
      this.detectionResults.global.push(...systemClaudeMCPs);

      // Check user home directory for MCP configurations
      const homeMCPs = await this.scanHomeMCPConfigs();
      this.detectionResults.global.push(...homeMCPs);

      console.log(chalk.gray(`   Found ${this.detectionResults.global.length} global MCP servers`));
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Error scanning global MCPs:'), error.message);
    }
  }

  /**
   * Detect project-specific MCP configurations
   */
  async detectProjectMCPServers(projectPath) {
    console.log(chalk.gray('📁 Scanning project-specific MCP servers...'));
    
    try {
      // Check .mcp.json in project root
      const projectMcpPath = path.join(projectPath, '.mcp.json');
      if (await fs.pathExists(projectMcpPath)) {
        const projectMCPs = await this.parseMCPConfig(projectMcpPath, 'project');
        this.detectionResults.project.push(...projectMCPs);
      }

      // Check .claude directory for MCP configurations
      const claudeDir = path.join(projectPath, '.claude');
      if (await fs.pathExists(claudeDir)) {
        const claudeMCPs = await this.scanClaudeDirectory(claudeDir, 'project');
        this.detectionResults.project.push(...claudeMCPs);
      }

      // Check package.json for MCP-related dependencies
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (await fs.pathExists(packageJsonPath)) {
        const packageMCPs = await this.scanPackageJsonMCPs(packageJsonPath, 'project');
        this.detectionResults.project.push(...packageMCPs);
      }

      // Check for common MCP server scripts and configurations
      const scriptMCPs = await this.scanProjectScripts(projectPath);
      this.detectionResults.project.push(...scriptMCPs);

      console.log(chalk.gray(`   Found ${this.detectionResults.project.length} project MCP servers`));
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Error scanning project MCPs:'), error.message);
    }
  }

  /**
   * Detect MCP servers in workspace (multi-project environment)
   */
  async detectWorkspaceMCPServers(projectPath) {
    console.log(chalk.gray('🏢 Scanning workspace MCP servers...'));
    
    try {
      // Look for parent workspace directories
      const workspaceRoots = await this.findWorkspaceRoots(projectPath);
      
      for (const workspaceRoot of workspaceRoots) {
        // Scan all subdirectories for MCP configurations
        const subProjects = await this.findSubProjects(workspaceRoot);
        
        for (const subProject of subProjects) {
          if (subProject !== projectPath) { // Don't double-scan current project
            const subProjectMCPs = await this.scanProjectDirectory(subProject, 'workspace');
            this.detectionResults.workspace.push(...subProjectMCPs);
          }
        }
      }

      console.log(chalk.gray(`   Found ${this.detectionResults.workspace.length} workspace MCP servers`));
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Error scanning workspace MCPs:'), error.message);
    }
  }

  /**
   * Detect system package MCPs (npm, pip, cargo, etc.)
   */
  async detectSystemPackageMCPs() {
    console.log(chalk.gray('📦 Scanning system package MCPs...'));
    
    try {
      const packageMCPs = [];

      // Scan npm packages for MCP servers
      const npmMCPs = await this.scanNpmPackageMCPs();
      packageMCPs.push(...npmMCPs);

      // Scan Python packages for MCP servers
      const pipMCPs = await this.scanPipPackageMCPs();
      packageMCPs.push(...pipMCPs);

      // Scan Rust crates for MCP servers
      const cargoMCPs = await this.scanCargoMCPs();
      packageMCPs.push(...cargoMCPs);

      this.detectionResults.systemPackages.push(...packageMCPs);
      console.log(chalk.gray(`   Found ${this.detectionResults.systemPackages.length} system package MCPs`));
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Error scanning system package MCPs:'), error.message);
    }
  }

  /**
   * Discover available MCP servers from repositories and registries
   */
  async discoverAvailableMCPs() {
    console.log(chalk.gray('🌐 Discovering available MCP servers...'));
    
    try {
      // This would be expanded to search various MCP registries
      const knownMCPs = this.getKnownMCPServers();
      this.detectionResults.discovered.push(...knownMCPs);
      
      console.log(chalk.gray(`   Discovered ${this.detectionResults.discovered.length} available MCP servers`));
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Error discovering available MCPs:'), error.message);
    }
  }

  /**
   * Scan npm global packages for MCP servers
   */
  async scanNpmGlobalMCPs() {
    const mcps = [];
    try {
      const { stdout } = await execAsync('npm list -g --json --depth=0');
      const globalPackages = JSON.parse(stdout);
      
      if (globalPackages.dependencies) {
        for (const [packageName, packageInfo] of Object.entries(globalPackages.dependencies)) {
          if (this.isMCPPackage(packageName, packageInfo)) {
            mcps.push({
              id: `npm-global-${packageName}`,
              name: packageName,
              version: packageInfo.version,
              location: 'global',
              source: 'npm-global',
              type: 'installed',
              command: this.inferMCPCommand(packageName),
              description: `Global npm package: ${packageName}`,
              path: packageInfo.path || 'unknown'
            });
          }
        }
      }
    } catch (error) {
      // npm might not be available or command might fail
      console.warn(chalk.yellow('Could not scan npm global packages'));
    }
    return mcps;
  }

  /**
   * Scan system Claude Code configurations
   */
  async scanSystemClaudeConfigs() {
    const mcps = [];
    const homedir = os.homedir();
    
    // Common Claude Code config locations
    const configPaths = [
      path.join(homedir, '.claude', 'mcp_settings.json'),
      path.join(homedir, '.config', 'claude', 'mcp_settings.json'),
      path.join(homedir, 'AppData', 'Roaming', 'Claude', 'mcp_settings.json'), // Windows
      path.join(homedir, 'Library', 'Application Support', 'Claude', 'mcp_settings.json') // macOS
    ];

    for (const configPath of configPaths) {
      try {
        if (await fs.pathExists(configPath)) {
          const configMCPs = await this.parseMCPConfig(configPath, 'system');
          mcps.push(...configMCPs);
        }
      } catch (error) {
        // Ignore individual config file errors
      }
    }

    return mcps;
  }

  /**
   * Scan home directory for MCP configurations
   */
  async scanHomeMCPConfigs() {
    const mcps = [];
    const homedir = os.homedir();
    
    try {
      // Look for .mcp.json in home directory
      const homeMcpPath = path.join(homedir, '.mcp.json');
      if (await fs.pathExists(homeMcpPath)) {
        const homeMCPs = await this.parseMCPConfig(homeMcpPath, 'home');
        mcps.push(...homeMCPs);
      }
    } catch (error) {
      // Ignore errors
    }

    return mcps;
  }

  /**
   * Parse MCP configuration file
   */
  async parseMCPConfig(configPath, source) {
    const mcps = [];
    
    try {
      const configContent = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(configContent);
      
      if (config.mcpServers) {
        for (const [serverId, serverConfig] of Object.entries(config.mcpServers)) {
          mcps.push({
            id: `${source}-${serverId}`,
            name: serverConfig.name || serverId,
            description: serverConfig.description || 'No description provided',
            command: serverConfig.command,
            args: serverConfig.args || [],
            env: serverConfig.env || {},
            location: source,
            source: 'config-file',
            type: 'configured',
            enabled: serverConfig.disabled !== true,
            configPath: configPath,
            originalConfig: serverConfig
          });
        }
      }
    } catch (error) {
      console.warn(chalk.yellow(`Error parsing MCP config ${configPath}:`, error.message));
    }

    return mcps;
  }

  /**
   * Scan Claude directory for MCP configurations
   */
  async scanClaudeDirectory(claudeDir, source) {
    const mcps = [];
    
    try {
      // Look for MCP-related files in .claude directory
      const files = await fs.readdir(claudeDir);
      
      for (const file of files) {
        const filePath = path.join(claudeDir, file);
        const stat = await fs.stat(filePath);
        
        if (stat.isFile() && (file.includes('mcp') || file.includes('server'))) {
          // Try to parse as JSON
          try {
            const content = await fs.readFile(filePath, 'utf8');
            const data = JSON.parse(content);
            
            if (data.mcpServers || data.servers) {
              const configMCPs = await this.parseMCPConfig(filePath, source);
              mcps.push(...configMCPs);
            }
          } catch (error) {
            // Not a valid JSON file, skip
          }
        }
      }
    } catch (error) {
      // Directory might not be accessible
    }

    return mcps;
  }

  /**
   * Scan package.json for MCP-related dependencies
   */
  async scanPackageJsonMCPs(packageJsonPath, source) {
    const mcps = [];
    
    try {
      const packageJson = await fs.readJSON(packageJsonPath);
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
        ...packageJson.peerDependencies
      };

      for (const [depName, version] of Object.entries(allDeps)) {
        if (this.isMCPPackage(depName, { version })) {
          mcps.push({
            id: `${source}-package-${depName}`,
            name: depName,
            version: version,
            location: source,
            source: 'package-dependency',
            type: 'dependency',
            command: this.inferMCPCommand(depName),
            description: `Package dependency: ${depName}@${version}`,
            packageJsonPath: packageJsonPath
          });
        }
      }
    } catch (error) {
      // Package.json might not be valid
    }

    return mcps;
  }

  /**
   * Scan project scripts for MCP server configurations
   */
  async scanProjectScripts(projectPath) {
    const mcps = [];
    
    try {
      // Look for common script files that might contain MCP servers
      const scriptPatterns = [
        'mcp-*.js', 'mcp-*.py', 'mcp-*.sh',
        '*-mcp.js', '*-mcp.py', '*-mcp.sh',
        'server-*.js', 'server-*.py'
      ];

      // This is a simplified implementation - would be expanded
      const files = await fs.readdir(projectPath);
      
      for (const file of files) {
        if (scriptPatterns.some(pattern => 
          file.includes(pattern.replace('*', '')) || 
          file.match(pattern.replace('*', '.*'))
        )) {
          const filePath = path.join(projectPath, file);
          const stat = await fs.stat(filePath);
          
          if (stat.isFile()) {
            mcps.push({
              id: `project-script-${file}`,
              name: path.basename(file, path.extname(file)),
              description: `MCP server script: ${file}`,
              command: this.inferCommandFromFile(filePath),
              location: 'project',
              source: 'script-file',
              type: 'script',
              scriptPath: filePath
            });
          }
        }
      }
    } catch (error) {
      // Directory might not be accessible
    }

    return mcps;
  }

  /**
   * Find workspace root directories
   */
  async findWorkspaceRoots(projectPath) {
    const workspaceRoots = [];
    let currentPath = projectPath;
    
    // Traverse up the directory tree looking for workspace indicators
    while (currentPath !== path.dirname(currentPath)) {
      const indicators = [
        'pnpm-workspace.yaml',
        'lerna.json',
        'rush.json',
        'workspace.json',
        'nx.json'
      ];

      for (const indicator of indicators) {
        if (await fs.pathExists(path.join(currentPath, indicator))) {
          workspaceRoots.push(currentPath);
          break;
        }
      }

      currentPath = path.dirname(currentPath);
    }

    return workspaceRoots;
  }

  /**
   * Find sub-projects in workspace
   */
  async findSubProjects(workspaceRoot) {
    const subProjects = [];
    
    try {
      const entries = await fs.readdir(workspaceRoot, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          const subProjectPath = path.join(workspaceRoot, entry.name);
          
          // Check if it's a project directory (has package.json, requirements.txt, etc.)
          const projectIndicators = ['package.json', 'requirements.txt', 'Cargo.toml', 'go.mod'];
          
          for (const indicator of projectIndicators) {
            if (await fs.pathExists(path.join(subProjectPath, indicator))) {
              subProjects.push(subProjectPath);
              break;
            }
          }
        }
      }
    } catch (error) {
      // Directory might not be accessible
    }

    return subProjects;
  }

  /**
   * Scan a project directory for MCP servers
   */
  async scanProjectDirectory(projectPath, source) {
    const mcps = [];
    
    // Reuse project scanning logic
    const projectMcpPath = path.join(projectPath, '.mcp.json');
    if (await fs.pathExists(projectMcpPath)) {
      const projectMCPs = await this.parseMCPConfig(projectMcpPath, source);
      mcps.push(...projectMCPs);
    }

    return mcps;
  }

  /**
   * Scan npm packages for MCP servers
   */
  async scanNpmPackageMCPs() {
    const mcps = [];
    
    try {
      // Search for packages with 'mcp' in their name
      const { stdout } = await execAsync('npm search mcp --json');
      const searchResults = JSON.parse(stdout);
      
      for (const pkg of searchResults) {
        if (this.isMCPPackage(pkg.name, pkg)) {
          mcps.push({
            id: `npm-${pkg.name}`,
            name: pkg.name,
            version: pkg.version,
            description: pkg.description || 'No description available',
            location: 'npm-registry',
            source: 'npm-search',
            type: 'available',
            command: this.inferMCPCommand(pkg.name),
            installCommand: `npm install -g ${pkg.name}`
          });
        }
      }
    } catch (error) {
      // npm search might fail or not be available
    }

    return mcps;
  }

  /**
   * Scan pip packages for MCP servers
   */
  async scanPipPackageMCPs() {
    const mcps = [];
    
    try {
      // Search for Python packages with 'mcp' in their name
      const { stdout } = await execAsync('pip search mcp');
      // Parse pip search results (simplified)
      const lines = stdout.split('\n');
      
      for (const line of lines) {
        if (line.includes('mcp') && line.includes('(')) {
          const match = line.match(/^([^\s]+)\s+\(([^)]+)\)\s+-\s+(.+)$/);
          if (match) {
            const [, name, version, description] = match;
            mcps.push({
              id: `pip-${name}`,
              name: name,
              version: version,
              description: description.trim(),
              location: 'pypi',
              source: 'pip-search',
              type: 'available',
              command: this.inferMCPCommand(name),
              installCommand: `pip install ${name}`
            });
          }
        }
      }
    } catch (error) {
      // pip search might not be available or might fail
    }

    return mcps;
  }

  /**
   * Scan Cargo crates for MCP servers
   */
  async scanCargoMCPs() {
    const mcps = [];
    
    try {
      // Search for Rust crates with 'mcp' in their name
      const { stdout } = await execAsync('cargo search mcp');
      const lines = stdout.split('\n');
      
      for (const line of lines) {
        if (line.includes('=') && line.includes('"')) {
          const match = line.match(/^([^\s]+)\s+=\s+"([^"]+)"\s+#\s+(.+)$/);
          if (match) {
            const [, name, version, description] = match;
            mcps.push({
              id: `cargo-${name}`,
              name: name,
              version: version,
              description: description.trim(),
              location: 'crates.io',
              source: 'cargo-search',
              type: 'available',
              command: this.inferMCPCommand(name),
              installCommand: `cargo install ${name}`
            });
          }
        }
      }
    } catch (error) {
      // cargo might not be available
    }

    return mcps;
  }

  /**
   * Get known MCP servers from curated list
   */
  getKnownMCPServers() {
    return [
      {
        id: 'filesystem',
        name: 'Filesystem MCP',
        description: 'Access and manipulate files and directories',
        location: 'registry',
        source: 'curated',
        type: 'available',
        command: 'npx @modelcontextprotocol/server-filesystem',
        installCommand: 'npm install -g @modelcontextprotocol/server-filesystem',
        category: 'filesystem',
        popularity: 'high'
      },
      {
        id: 'memory-bank',
        name: 'Memory Bank MCP',
        description: 'Persistent memory and knowledge storage',
        location: 'registry',
        source: 'curated',
        type: 'available',
        command: 'npx @modelcontextprotocol/server-memory',
        installCommand: 'npm install -g @modelcontextprotocol/server-memory',
        category: 'memory',
        popularity: 'high'
      },
      {
        id: 'web-search',
        name: 'Web Search MCP',
        description: 'Search the web and retrieve information',
        location: 'registry',
        source: 'curated',
        type: 'available',
        command: 'npx @modelcontextprotocol/server-web-search',
        installCommand: 'npm install -g @modelcontextprotocol/server-web-search',
        category: 'web',
        popularity: 'high'
      },
      {
        id: 'database',
        name: 'Database MCP',
        description: 'Connect to and query databases',
        location: 'registry',
        source: 'curated',
        type: 'available',
        command: 'npx @modelcontextprotocol/server-database',
        installCommand: 'npm install -g @modelcontextprotocol/server-database',
        category: 'database',
        popularity: 'medium'
      }
    ];
  }

  /**
   * Check if a package is likely an MCP server
   */
  isMCPPackage(packageName, packageInfo) {
    const mcpIndicators = [
      'mcp',
      'model-context-protocol',
      'claude-mcp',
      'anthropic-mcp'
    ];

    const name = packageName.toLowerCase();
    const description = (packageInfo.description || '').toLowerCase();

    return mcpIndicators.some(indicator => 
      name.includes(indicator) || description.includes(indicator)
    );
  }

  /**
   * Infer MCP command from package name
   */
  inferMCPCommand(packageName) {
    if (packageName.startsWith('@modelcontextprotocol/')) {
      return `npx ${packageName}`;
    }
    if (packageName.includes('mcp')) {
      return `npx ${packageName}`;
    }
    return `node ${packageName}`;
  }

  /**
   * Infer command from file extension and content
   */
  inferCommandFromFile(filePath) {
    const ext = path.extname(filePath);
    const basename = path.basename(filePath);

    switch (ext) {
      case '.js':
        return `node ${basename}`;
      case '.py':
        return `python ${basename}`;
      case '.sh':
        return `bash ${basename}`;
      case '.rs':
        return `cargo run --bin ${path.basename(basename, ext)}`;
      default:
        return basename;
    }
  }

  /**
   * Get all detected servers in a unified format
   */
  getAllDetectedServers() {
    const allServers = [
      ...this.detectionResults.global,
      ...this.detectionResults.project,
      ...this.detectionResults.workspace,
      ...this.detectionResults.systemPackages,
      ...this.detectionResults.discovered
    ];

    // Remove duplicates based on command or name
    const uniqueServers = [];
    const seen = new Set();

    for (const server of allServers) {
      const key = server.command || server.name;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueServers.push(server);
      }
    }

    return uniqueServers;
  }
}

module.exports = MCPServerDetector;