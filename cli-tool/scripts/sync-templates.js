#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

/**
 * Script to synchronize templates from root folders 
 * to cli-tool/templates/
 */

async function syncTemplates() {
  console.log(chalk.blue('🔄 Synchronizing templates...'));
  
  const rootDir = path.join(__dirname, '..', '..');
  const templatesDir = path.join(__dirname, '..', 'templates');
  
  // Languages to synchronize
  const languages = ['common', 'javascript-typescript', 'python', 'rust', 'go'];
  
  let totalCopied = 0;
  let totalSkipped = 0;
  
  for (const language of languages) {
    const sourceDir = path.join(rootDir, language);
    const targetDir = path.join(templatesDir, language);
    
    if (!await fs.pathExists(sourceDir)) {
      console.log(chalk.yellow(`⚠️  Source folder does not exist: ${language}`));
      continue;
    }
    
    console.log(chalk.cyan(`\n📂 Synchronizing ${language}...`));
    
    // Clean destination directory
    if (await fs.pathExists(targetDir)) {
      await fs.remove(targetDir);
      console.log(chalk.gray(`   🗑️  Previous directory removed`));
    }
    
    // Copy everything from source
    try {
      await fs.copy(sourceDir, targetDir, {
        filter: (src, dest) => {
          // Filter files we don't want to copy
          const relativePath = path.relative(sourceDir, src);
          
          // Exclude specific directories and files
          if (relativePath.includes('node_modules')) return false;
          if (relativePath.includes('.git')) return false;
          if (relativePath.includes('package-lock.json')) return false;
          if (relativePath.endsWith('.log')) return false;
          
          return true;
        }
      });
      
      // Count copied files
      const stats = await getDirectoryStats(targetDir);
      totalCopied += stats.files;
      
      console.log(chalk.green(`   ✅ ${stats.files} files copied`));
      
      // Show copied structure
      if (stats.files > 0) {
        await showDirectoryStructure(targetDir, '   ');
      }
      
    } catch (error) {
      console.error(chalk.red(`   ❌ Error copying ${language}:`), error.message);
    }
  }
  
  console.log(chalk.green(`\n🎉 Synchronization completed!`));
  console.log(chalk.white(`📊 Total synchronized files: ${totalCopied}`));
  
  // Verify that no hook files exist
  await cleanupOldReferences();
}

async function getDirectoryStats(dir) {
  let files = 0;
  let dirs = 0;
  
  if (!await fs.pathExists(dir)) {
    return { files: 0, dirs: 0 };
  }
  
  const items = await fs.readdir(dir);
  
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = await fs.stat(itemPath);
    
    if (stat.isDirectory()) {
      dirs++;
      const subStats = await getDirectoryStats(itemPath);
      files += subStats.files;
      dirs += subStats.dirs;
    } else {
      files++;
    }
  }
  
  return { files, dirs };
}

async function showDirectoryStructure(dir, prefix = '') {
  const items = await fs.readdir(dir);
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemPath = path.join(dir, item);
    const stat = await fs.stat(itemPath);
    const isLast = i === items.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    
    if (stat.isDirectory()) {
      console.log(chalk.blue(`${prefix}${connector}${item}/`));
      if (item === '.claude' || item === 'commands') {
        // Show only one more level for .claude and commands
        const subItems = await fs.readdir(itemPath);
        const newPrefix = prefix + (isLast ? '    ' : '│   ');
        for (let j = 0; j < Math.min(subItems.length, 3); j++) {
          const subItem = subItems[j];
          const subConnector = j === Math.min(subItems.length, 3) - 1 ? '└── ' : '├── ';
          console.log(chalk.gray(`${newPrefix}${subConnector}${subItem}`));
        }
        if (subItems.length > 3) {
          console.log(chalk.gray(`${newPrefix}└── ... and ${subItems.length - 3} more`));
        }
      }
    } else {
      console.log(chalk.gray(`${prefix}${connector}${item}`));
    }
  }
}

async function cleanupOldReferences() {
  console.log(chalk.yellow('\n🧹 Cleaning up obsolete references...'));
  
  const templatesDir = path.join(__dirname, '..', 'templates');
  
  // Search and remove hooks directories
  const languages = ['javascript-typescript', 'python', 'common'];
  
  for (const language of languages) {
    const hooksDir = path.join(templatesDir, language, '.claude', 'hooks');
    if (await fs.pathExists(hooksDir)) {
      await fs.remove(hooksDir);
      console.log(chalk.yellow(`   🗑️  Removed: ${language}/.claude/hooks/`));
    }
  }
  
  // Check for empty files in commands
  for (const language of languages) {
    const commandsDir = path.join(templatesDir, language, '.claude', 'commands');
    if (await fs.pathExists(commandsDir)) {
      const files = await fs.readdir(commandsDir);
      for (const file of files) {
        const filePath = path.join(commandsDir, file);
        const stat = await fs.stat(filePath);
        if (stat.size < 50) { // Very small files are probably empty
          const content = await fs.readFile(filePath, 'utf8');
          if (content.trim().length < 10) {
            console.log(chalk.yellow(`   ⚠️  Possibly empty file: ${language}/.claude/commands/${file} (${stat.size} bytes)`));
          }
        }
      }
    }
  }
}

// Function to execute synchronization
if (require.main === module) {
  syncTemplates().catch(error => {
    console.error(chalk.red('❌ Error during synchronization:'), error);
    process.exit(1);
  });
}

module.exports = { syncTemplates };