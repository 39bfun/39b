#!/usr/bin/env node

/**
 * Web3 Project Generation Framework CLI
 * Provides command line interface for users to use the Web3 project generation framework
 */

const path = require('path');
const fs = require('fs').promises;
const { program } = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const Web3ProjectManager = require('../core/web3ProjectManager');

// Version information
const packageJson = require('../../package.json');
const version = packageJson.version || '1.0.0';

// Initialize command line program
program
  .name('web3-project')
  .description('Web3 Project Generation Framework - Generate blockchain projects using AI')
  .version(version);

/**
 * Check environment variables
 * @returns {boolean} - Whether necessary environment variables are set
 */
const checkEnvironment = () => {
  const requiredVars = ['CLAUDE_API_KEY'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(chalk.red('Error: Missing required environment variables:'));
    missingVars.forEach(varName => {
      console.error(chalk.red(`  - ${varName}`));
    });
    console.log(chalk.yellow('\nTip: You can set these variables in a .env file, or set them before running the command:'));
    console.log(chalk.yellow(`  CLAUDE_API_KEY=your_api_key ${process.argv[1]} [command]\n`));
    return false;
  }
  
  return true;
};

/**
 * Create new project
 * @param {Object} options - Command line options
 */
const createProject = async (options) => {
  try {
    if (!checkEnvironment()) {
      return;
    }
    
    const spinner = ora('Initializing project manager...').start();
    
    // Create project manager
    const projectManager = new Web3ProjectManager({
      apiKey: process.env.CLAUDE_API_KEY,
      outputDir: options.outputDir || path.join(process.cwd(), 'output'),
      defaultBlockchain: options.blockchain,
      useGptEngineer: options.useGptEngineer !== undefined ? options.useGptEngineer : true,
      multiChainSupport: options.multiChain
    });
    
    // Initialize project manager
    await projectManager.initialize();
    
    spinner.succeed('Project manager initialized');
    
    // If project name is not provided, prompt user for input
    let projectName = options.name;
    let description = options.description;
    let blockchain = options.blockchain;
    let projectType = options.type;
    let testFramework = options.testFramework;
    let additionalBlockchains = options.additionalBlockchains || [];
    
    // If necessary parameters are not provided, use interactive prompts
    if (!projectName || !description || !blockchain || !projectType) {
      console.log(chalk.blue('\nPlease provide project information:'));
      
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'projectName',
          message: 'Project Name:',
          default: projectName || 'my-web3-project',
          when: !projectName
        },
        {
          type: 'input',
          name: 'description',
          message: 'Project Description:',
          default: description || 'A Web3 project',
          when: !description
        },
        {
          type: 'list',
          name: 'blockchain',
          message: 'Main Blockchain:',
          choices: ['ethereum', 'solana', 'bnbchain', 'base'],
          default: blockchain || 'ethereum',
          when: !blockchain
        },
        {
          type: 'list',
          name: 'projectType',
          message: 'Project Type:',
          choices: ['token', 'nft', 'dapp'],
          default: projectType || 'dapp',
          when: !projectType
        },
        {
          type: 'list',
          name: 'testFramework',
          message: 'Test Framework:',
          choices: (answers) => {
            const chain = answers.blockchain || blockchain;
            if (chain === 'ethereum') {
              return ['hardhat', 'truffle'];
            } else if (chain === 'solana') {
              return ['anchor'];
            } else if (chain === 'bnbchain') {
              return ['hardhat', 'truffle'];
            } else if (chain === 'base') {
              return ['hardhat', 'foundry'];
            }
            return ['hardhat'];
          },
          default: (answers) => {
            const chain = answers.blockchain || blockchain;
            if (chain === 'ethereum') {
              return 'hardhat';
            } else if (chain === 'solana') {
              return 'anchor';
            } else if (chain === 'bnbchain') {
              return 'hardhat';
            } else if (chain === 'base') {
              return 'hardhat';
            }
            return 'hardhat';
          },
          when: !testFramework
        },
        {
          type: 'confirm',
          name: 'multiChain',
          message: 'Enable multi-chain support?',
          default: options.multiChain || false,
          when: options.multiChain === undefined
        },
        {
          type: 'checkbox',
          name: 'additionalBlockchains',
          message: 'Additional supported blockchains:',
          choices: (answers) => {
            const primaryChain = answers.blockchain || blockchain;
            return ['ethereum', 'solana', 'bnbchain', 'base'].filter(chain => chain !== primaryChain);
          },
          when: (answers) => answers.multiChain && additionalBlockchains.length === 0
        }
      ]);
      
      // Update options
      projectName = answers.projectName || projectName;
      description = answers.description || description;
      blockchain = answers.blockchain || blockchain;
      projectType = answers.projectType || projectType;
      testFramework = answers.testFramework || testFramework;
      
      if (answers.multiChain) {
        options.multiChain = true;
        additionalBlockchains = answers.additionalBlockchains || additionalBlockchains;
      }
    }
    
    // Generate project
    spinner.text = `Generating ${blockchain} ${projectType} project: ${projectName}...`;
    spinner.start();
    
    const result = await projectManager.generateProject(
      projectName,
      description,
      {
        blockchain,
        projectType,
        testFramework,
        additionalBlockchains,
        outputDir: options.outputDir ? path.join(options.outputDir, projectName) : undefined
      }
    );
    
    if (result.success) {
      spinner.succeed(`Project ${projectName} generated successfully!`);
      console.log(chalk.green(`\nProject generated at: ${result.outputDir}`));
      console.log(chalk.blue('\nNext steps:'));
      console.log(chalk.yellow(`  cd ${result.outputDir}`));
      console.log(chalk.yellow('  npm install'));
      console.log(chalk.yellow('  npm start'));
    } else {
      spinner.fail(`Project generation failed: ${result.error}`);
    }
  } catch (error) {
    console.error(chalk.red('Project generation failed:'), error);
  }
};

// Create new project command
program
  .command('create')
  .description('Create new Web3 project')
  .option('-n, --name <name>', 'Project name')
  .option('-d, --description <description>', 'Project description')
  .option('-b, --blockchain <blockchain>', 'Blockchain type (ethereum, solana, bnbchain, base)', 'ethereum')
  .option('-t, --type <type>', 'Project type (token, nft, dapp)', 'dapp')
  .option('-f, --test-framework <framework>', 'Test framework (hardhat, truffle, anchor)')
  .option('-o, --output-dir <dir>', 'Output directory')
  .option('-g, --use-gpt-engineer', 'Use gpt-engineer to generate code', true)
  .option('-m, --multi-chain', 'Enable multi-chain support', false)
  .option('-a, --additional-blockchains <blockchains...>', 'Additional supported blockchains')
  .action(createProject);

// List supported blockchains command
program
  .command('list-blockchains')
  .description('List supported blockchains')
  .action(async () => {
    try {
      if (!checkEnvironment()) {
        return;
      }
      
      const projectManager = new Web3ProjectManager({
        apiKey: process.env.CLAUDE_API_KEY
      });
      
      const blockchains = projectManager.getSupportedBlockchains();
      
      console.log(chalk.blue('\nSupported blockchains:'));
      blockchains.forEach(blockchain => {
        console.log(chalk.green(`  - ${blockchain}`));
      });
      console.log();
    } catch (error) {
      console.error(chalk.red('Failed to get supported blockchains:'), error);
    }
  });

// List supported test frameworks command
program
  .command('list-test-frameworks')
  .description('List supported test frameworks')
  .option('-b, --blockchain <blockchain>', 'Blockchain type (ethereum, solana, bnbchain, base)', 'ethereum')
  .action(async (options) => {
    try {
      if (!checkEnvironment()) {
        return;
      }
      
      const projectManager = new Web3ProjectManager({
        apiKey: process.env.CLAUDE_API_KEY
      });
      
      const frameworks = projectManager.getSupportedTestFrameworks(options.blockchain);
      
      console.log(chalk.blue(`\nSupported test frameworks for ${options.blockchain}:`));
      frameworks.forEach(framework => {
        console.log(chalk.green(`  - ${framework}`));
      });
      console.log();
    } catch (error) {
      console.error(chalk.red('Failed to get supported test frameworks:'), error);
    }
  });

// Add multi-chain support command
program
  .command('add-multi-chain')
  .description('Add multi-chain support to existing project')
  .option('-p, --project-dir <dir>', 'Project directory (required)')
  .option('-b, --primary-blockchain <blockchain>', 'Primary blockchain (ethereum, solana, bnbchain, base)', 'ethereum')
  .option('-a, --additional-blockchains <blockchains...>', 'Additional supported blockchains')
  .action(async (options) => {
    try {
      if (!checkEnvironment()) {
        return;
      }
      
      if (!options.projectDir) {
        console.error(chalk.red('Error: Missing project directory parameter'));
        console.log(chalk.yellow('Usage: web3-project add-multi-chain --project-dir <dir> --additional-blockchains <blockchains...>'));
        return;
      }
      
      if (!options.additionalBlockchains || options.additionalBlockchains.length === 0) {
        // If no additional blockchains provided, prompt user to select
        const answers = await inquirer.prompt([
          {
            type: 'checkbox',
            name: 'additionalBlockchains',
            message: 'Select blockchains to add:',
            choices: ['ethereum', 'solana', 'bnbchain', 'base'].filter(chain => chain !== options.primaryBlockchain),
            validate: (value) => value.length > 0 ? true : 'Please select at least one blockchain'
          }
        ]);
        
        options.additionalBlockchains = answers.additionalBlockchains;
      }
      
      const spinner = ora('Initializing project manager...').start();
      
      // Create project manager
      const projectManager = new Web3ProjectManager({
        apiKey: process.env.CLAUDE_API_KEY
      });
      
      // Initialize project manager
      await projectManager.initialize();
      
      spinner.succeed('Project manager initialized');
      
      // Add multi-chain support
      spinner.text = `Adding multi-chain support...`;
      spinner.start();
      
      const result = await projectManager.addMultiChainSupport(
        options.projectDir,
        options.primaryBlockchain,
        options.additionalBlockchains
      );
      
      if (result) {
        spinner.succeed('Multi-chain support added successfully!');
        console.log(chalk.green(`\nAdded support for the following blockchains:`));
        console.log(chalk.yellow(`  - Primary blockchain: ${options.primaryBlockchain}`));
        console.log(chalk.yellow(`  - Additional blockchains: ${options.additionalBlockchains.join(', ')}`));
        console.log(chalk.blue('\nBridge code generated at:'));
        console.log(chalk.yellow(`  ${path.join(options.projectDir, 'src', 'bridge', 'index.js')}`));
      } else {
        spinner.fail('Failed to add multi-chain support');
      }
    } catch (error) {
      console.error(chalk.red('Failed to add multi-chain support:'), error);
    }
  });

// Add examples command
program
  .command('examples')
  .description('Show usage examples')
  .action(() => {
    console.log(chalk.blue('\n39b Web3 Project Generation Framework Usage Examples:\n'));
    
    console.log(chalk.yellow('1. Create Ethereum ERC20 token project:'));
    console.log(chalk.green('  node src/cli/web3-project-cli.js create --name my-token --description "My ERC20 Token" --blockchain ethereum --type token\n'));
    
    console.log(chalk.yellow('2. Create Solana NFT project:'));
    console.log(chalk.green('  node src/cli/web3-project-cli.js create --name solana-nft --description "Solana NFT Collection" --blockchain solana --type nft\n'));
    
    console.log(chalk.yellow('3. Create BNB Chain DApp project:'));
    console.log(chalk.green('  node src/cli/web3-project-cli.js create --name bnb-dapp --description "BNB Chain DApp" --blockchain bnbchain --type dapp\n'));
    
    console.log(chalk.yellow('4. Create Base Chain project:'));
    console.log(chalk.green('  node src/cli/web3-project-cli.js create --name base-app --description "Base Chain Application" --blockchain base --type dapp\n'));
    
    console.log(chalk.yellow('5. Create multi-chain project:'));
    console.log(chalk.green('  node src/cli/web3-project-cli.js create --name multi-chain-app --description "Multi-chain Application" --blockchain ethereum --type dapp --multi-chain --additional-blockchains bnbchain base\n'));
    
    console.log(chalk.yellow('6. Add multi-chain support to existing project:'));
    console.log(chalk.green('  node src/cli/web3-project-cli.js add-multi-chain --project-dir ./my-project --primary-blockchain ethereum --additional-blockchains bnbchain base\n'));
  });

// Parse command line arguments
program.parse(process.argv);

// If no command is provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
