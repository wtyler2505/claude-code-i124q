const chalk = require('chalk');
const { getAvailableLanguages, getFrameworksForLanguage } = require('./templates');

function createPrompts(projectInfo, options = {}) {
  const prompts = [];
  
  // Language selection
  if (!options.language) {
    const languages = getAvailableLanguages();
    prompts.push({
      type: 'list',
      name: 'language',
      message: 'Select your programming language:',
      choices: languages,
      default: projectInfo.detectedLanguage || 'common',
      prefix: chalk.blue('🔤')
    });
  }
  
  // Framework selection (conditional)
  if (!options.framework) {
    prompts.push({
      type: 'list',
      name: 'framework',
      message: 'Select your framework (optional):',
      choices: (answers) => {
        const selectedLanguage = answers.language || options.language;
        const frameworks = getFrameworksForLanguage(selectedLanguage);
        return [
          { value: 'none', name: 'None / Generic' },
          ...frameworks
        ];
      },
      default: projectInfo.detectedFramework || 'none',
      prefix: chalk.green('🎯'),
      when: (answers) => {
        const selectedLanguage = answers.language || options.language;
        const frameworks = getFrameworksForLanguage(selectedLanguage);
        return frameworks.length > 0;
      }
    });
  }
  
  // Features selection
  prompts.push({
    type: 'checkbox',
    name: 'features',
    message: 'Select additional features:',
    choices: [
      {
        value: 'git-hooks',
        name: 'Git hooks integration',
        checked: false
      },
      {
        value: 'testing',
        name: 'Enhanced testing commands',
        checked: true
      },
      {
        value: 'linting',
        name: 'Code linting and formatting',
        checked: true
      },
      {
        value: 'debugging',
        name: 'Debugging helpers',
        checked: false
      }
    ],
    prefix: chalk.yellow('⚙️')
  });
  
  // Confirmation
  prompts.push({
    type: 'confirm',
    name: 'confirm',
    message: (answers) => {
      const language = answers.language || options.language || 'common';
      const framework = answers.framework || options.framework || 'none';
      return `Setup Claude Code for ${chalk.cyan(language)}${framework !== 'none' ? ` with ${chalk.green(framework)}` : ''}?`;
    },
    default: true,
    prefix: chalk.red('🚀')
  });
  
  return prompts;
}

function createProjectTypePrompt(detectedTypes) {
  if (detectedTypes.length === 0) {
    return null;
  }
  
  return {
    type: 'list',
    name: 'projectType',
    message: 'We detected multiple project types. Which one should we prioritize?',
    choices: detectedTypes.map(type => ({
      value: type.language,
      name: `${type.language} (${type.confidence}% confidence)`
    })),
    prefix: chalk.magenta('🔍')
  };
}

module.exports = {
  createPrompts,
  createProjectTypePrompt
};