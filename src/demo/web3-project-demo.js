/**
 * Web3 Project Generation Framework Demo
 * Demonstrates how to use Web3ProjectManager to generate projects
 */

require('dotenv').config();
const path = require('path');
const Web3ProjectManager = require('../core/web3ProjectManager');

// Check environment variables
if (!process.env.CLAUDE_API_KEY) {
  console.error('Error: Missing CLAUDE_API_KEY environment variable');
  console.log('Please set CLAUDE_API_KEY in your .env file');
  process.exit(1);
}

/**
 * Run the demo
 */
async function runDemo() {
  console.log('Starting Web3 Project Generation Framework Demo...');
  
  // Create project manager
  const projectManager = new Web3ProjectManager({
    apiKey: process.env.CLAUDE_API_KEY,
    outputDir: path.join(__dirname, '../../demo-output'),
    defaultBlockchain: 'ethereum',
    useGptEngineer: true,
    multiChainSupport: true
  });
  
  // Initialize project manager
  console.log('Initializing project manager...');
  await projectManager.initialize();
  
  // Generate Ethereum ERC20 token project
  console.log('\nGenerating Ethereum ERC20 token project...');
  const tokenProject = await projectManager.generateProject(
    'my-erc20-token',
    'A simple ERC20 token with minting and burning capabilities',
    {
      blockchain: 'ethereum',
      projectType: 'token',
      testFramework: 'hardhat'
    }
  );
  
  if (tokenProject.success) {
    console.log(`Project generated successfully: ${tokenProject.outputDir}`);
  } else {
    console.error(`Project generation failed: ${tokenProject.error}`);
  }
  
  // Generate Solana NFT project
  console.log('\nGenerating Solana NFT project...');
  const nftProject = await projectManager.generateProject(
    'my-solana-nft',
    'A Solana NFT collection with minting and trading capabilities',
    {
      blockchain: 'solana',
      projectType: 'nft',
      testFramework: 'anchor'
    }
  );
  
  if (nftProject.success) {
    console.log(`Project generated successfully: ${nftProject.outputDir}`);
  } else {
    console.error(`Project generation failed: ${nftProject.error}`);
  }
  
  // Generate multi-chain DApp project
  console.log('\nGenerating multi-chain DApp project...');
  const dappProject = await projectManager.generateProject(
    'multi-chain-dapp',
    'A multi-chain DApp supporting Ethereum and Solana, allowing users to manage assets across different chains',
    {
      blockchain: 'ethereum',
      projectType: 'dapp',
      testFramework: 'hardhat',
      additionalBlockchains: ['solana']
    }
  );
  
  if (dappProject.success) {
    console.log(`Project generated successfully: ${dappProject.outputDir}`);
  } else {
    console.error(`Project generation failed: ${dappProject.error}`);
  }
  
  console.log('\nDemo completed!');
}

// Run the demo
runDemo().catch(error => {
  console.error('Demo execution failed:', error);
});
