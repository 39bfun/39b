# Getting Started

This guide will help you quickly get started with the 39B framework, from installation to creating your first Web3 project.

## Installation

First, clone the repository and install dependencies:

```bash
git clone https://github.com/your-username/39b.git
cd 39b
npm install
```

## Configure Environment Variables

Create a `.env` file and set the necessary environment variables:

```bash
CLAUDE_API_KEY=your_api_key
NODE_ENV=development
```

## Using the CLI Tool

39B provides a command-line tool to help you quickly create projects:

```bash
# View help information
node src/cli/web3-project-cli.js

# Create new project (interactive)
node src/cli/web3-project-cli.js create

# Create specific project (command line arguments)
node src/cli/web3-project-cli.js create --name my-token --description "My ERC20 Token" --blockchain ethereum --type token
```

## Programmatic Usage

You can also use 39B in your code:

```javascript
const Web3ProjectManager = require('./src/core/web3ProjectManager');

// Create project manager
const projectManager = new Web3ProjectManager({
  apiKey: process.env.CLAUDE_API_KEY,
  outputDir: './output',
  defaultBlockchain: 'ethereum',
  useGptEngineer: true,
  multiChainSupport: true
});

// Initialize project manager
await projectManager.initialize();

// Generate project
const result = await projectManager.generateProject(
  'my-project',
  'An ERC20 token project with minting and burning capabilities',
  {
    blockchain: 'ethereum',
    projectType: 'token',
    testFramework: 'hardhat'
  }
);

console.log(`Project generated at: ${result.outputDir}`);
```

## Using Enhanced Claude API

39B provides an enhanced Claude API call method that supports various advanced features:

```javascript
const ClaudeService = require('./src/core/claude');

// Initialize Claude service
const claudeService = new ClaudeService({
  apiKey: process.env.CLAUDE_API_KEY,
  model: 'claude-3-opus-20240229',
  maxTokens: 4000
});

// Basic call
const response = await claudeService.enhancedCallClaudeAPI(
  'Create a simple ERC20 token contract for Ethereum',
  {
    extractCode: true,
    blockchainContext: 'ethereum'
  }
);

console.log('Generated code:', response.code);
```

## Running Demos

You can run demo scripts to understand the framework's functionality:

```bash
# Run basic demo
node src/demo/web3-project-demo.js

# Run enhanced Claude API demo
node src/demo/enhanced-claude-api-demo.js
```

## Next Steps

- Check out the [API Reference](./api-reference.md) for more detailed information
- Browse the [Tutorials](./tutorials/README.md) to learn how to use various features of the framework
- Explore [Advanced Features](./advanced-features.md) to learn about more advanced use cases
