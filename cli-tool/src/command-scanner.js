const fs = require('fs-extra');
const path = require('path');

/**
 * Scans and returns available commands for a given language
 * @param {string} language - The language template to scan
 * @returns {Array} Array of available commands with metadata
 */
function getAvailableCommands(language) {
  const templatesDir = path.join(__dirname, '..', 'templates');
  const languageDir = path.join(templatesDir, language);
  
  // Check if language directory exists
  if (!fs.existsSync(languageDir)) {
    return [];
  }
  
  const commands = [];
  
  // Scan main .claude/commands directory
  const mainCommandsDir = path.join(languageDir, '.claude', 'commands');
  if (fs.existsSync(mainCommandsDir)) {
    const mainCommands = scanCommandsInDirectory(mainCommandsDir, 'core');
    commands.push(...mainCommands);
  }
  
  // Scan framework-specific commands in examples
  const examplesDir = path.join(languageDir, 'examples');
  if (fs.existsSync(examplesDir)) {
    const frameworkDirs = fs.readdirSync(examplesDir).filter(dir => {
      return fs.statSync(path.join(examplesDir, dir)).isDirectory();
    });
    
    frameworkDirs.forEach(framework => {
      const frameworkCommandsDir = path.join(examplesDir, framework, '.claude', 'commands');
      if (fs.existsSync(frameworkCommandsDir)) {
        const frameworkCommands = scanCommandsInDirectory(frameworkCommandsDir, framework);
        commands.push(...frameworkCommands);
      }
    });
  }
  
  // Remove duplicates based on command name
  const uniqueCommands = commands.reduce((acc, command) => {
    const existing = acc.find(c => c.name === command.name);
    if (!existing) {
      acc.push(command);
    } else {
      // If duplicate, prefer core commands over framework-specific ones
      if (command.category === 'core' && existing.category !== 'core') {
        const index = acc.findIndex(c => c.name === command.name);
        acc[index] = command;
      }
    }
    return acc;
  }, []);
  
  return uniqueCommands.sort((a, b) => {
    // Sort by category first (core first), then by name
    if (a.category !== b.category) {
      return a.category === 'core' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

/**
 * Scans a directory for command files and returns command metadata
 * @param {string} commandsDir - Directory to scan
 * @param {string} category - Category of commands (core, react-app, node-api, etc.)
 * @returns {Array} Array of command objects
 */
function scanCommandsInDirectory(commandsDir, category) {
  const commands = [];
  
  try {
    const files = fs.readdirSync(commandsDir);
    
    files.forEach(file => {
      if (path.extname(file) === '.md') {
        const commandName = path.basename(file, '.md');
        const filePath = path.join(commandsDir, file);
        
        // Read the command file to extract metadata
        const content = fs.readFileSync(filePath, 'utf8');
        const metadata = parseCommandMetadata(content, commandName);
        
        commands.push({
          name: commandName,
          displayName: metadata.title || commandName,
          description: metadata.description || `${commandName} command`,
          category: category,
          filePath: filePath,
          checked: metadata.defaultChecked || false
        });
      }
    });
  } catch (error) {
    console.warn(`Warning: Could not scan commands in ${commandsDir}:`, error.message);
  }
  
  return commands;
}

/**
 * Parses command metadata from markdown file content
 * @param {string} content - The markdown content
 * @param {string} commandName - The command name
 * @returns {Object} Parsed metadata
 */
function parseCommandMetadata(content, commandName) {
  const metadata = {
    title: null,
    description: null,
    defaultChecked: false
  };
  
  const lines = content.split('\n');
  
  // Extract title from first heading
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i].trim();
    if (line.startsWith('# ')) {
      metadata.title = line.substring(2).trim();
      break;
    }
  }
  
  // Extract description from purpose section or first paragraph
  const purposeMatch = content.match(/## Purpose\s*\n\s*(.+?)(?=\n\n|\n##|$)/s);
  if (purposeMatch) {
    metadata.description = purposeMatch[1].trim().replace(/\n/g, ' ');
  } else {
    // Try to find first paragraph after title
    const paragraphMatch = content.match(/^#[^\n]*\n\s*\n(.+?)(?=\n\n|\n##|$)/s);
    if (paragraphMatch) {
      metadata.description = paragraphMatch[1].trim().replace(/\n/g, ' ');
    }
  }
  
  // Determine default checked state (core commands usually checked by default)
  const coreCommands = ['test', 'lint', 'debug', 'refactor'];
  metadata.defaultChecked = coreCommands.includes(commandName);
  
  return metadata;
}

/**
 * Get commands available for a specific language and framework combination
 * @param {string} language - The language template
 * @param {string} framework - The framework (optional)
 * @returns {Array} Array of available commands
 */
function getCommandsForLanguageAndFramework(language, framework = null) {
  const allCommands = getAvailableCommands(language);
  
  if (!framework || framework === 'none') {
    // Return only core commands
    return allCommands.filter(cmd => cmd.category === 'core');
  }
  
  // Return core commands + framework-specific commands
  return allCommands.filter(cmd => 
    cmd.category === 'core' || 
    cmd.category === framework ||
    cmd.category === `${framework}-app`
  );
}

module.exports = {
  getAvailableCommands,
  getCommandsForLanguageAndFramework,
  scanCommandsInDirectory,
  parseCommandMetadata
};