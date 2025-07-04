const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

async function copyTemplateFiles(templateConfig, targetDir) {
  const templateDir = path.join(__dirname, '../templates');
  
  // Check if CLAUDE.md already exists
  const claudeFile = path.join(targetDir, 'CLAUDE.md');
  if (await fs.pathExists(claudeFile)) {
    // Create backup
    const backupFile = path.join(targetDir, 'CLAUDE.md.backup');
    await fs.copy(claudeFile, backupFile);
    console.log(chalk.yellow(`📋 Existing CLAUDE.md backed up to CLAUDE.md.backup`));
  }
  
  // Check if .claude directory already exists
  const claudeDir = path.join(targetDir, '.claude');
  if (await fs.pathExists(claudeDir)) {
    // Create backup
    const backupDir = path.join(targetDir, '.claude.backup');
    await fs.copy(claudeDir, backupDir);
    console.log(chalk.yellow(`📁 Existing .claude directory backed up to .claude.backup`));
  }
  
  // Copy files
  for (const file of templateConfig.files) {
    const sourcePath = path.join(templateDir, file.source);
    const destPath = path.join(targetDir, file.destination);
    
    try {
      await fs.copy(sourcePath, destPath, { overwrite: true });
      console.log(chalk.green(`✓ Copied ${file.source} → ${file.destination}`));
    } catch (error) {
      console.error(chalk.red(`✗ Failed to copy ${file.source}:`), error.message);
      throw error;
    }
  }
}

async function ensureDirectoryExists(dirPath) {
  try {
    await fs.ensureDir(dirPath);
    return true;
  } catch (error) {
    console.error(chalk.red(`Failed to create directory ${dirPath}:`), error.message);
    return false;
  }
}

async function checkWritePermissions(targetDir) {
  try {
    const testFile = path.join(targetDir, '.claude-test-write');
    await fs.writeFile(testFile, 'test');
    await fs.remove(testFile);
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  copyTemplateFiles,
  ensureDirectoryExists,
  checkWritePermissions
};