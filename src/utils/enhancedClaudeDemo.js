/**
 * Enhanced Claude Service Demo
 * Demonstrates how to use enhanced Claude service to generate blockchain-specific code
 */

const ClaudeService = require('../core/claude');
const ClaudeEnhancer = require('./claudeEnhancer');

/**
 * Demonstrate the use of enhanced Claude service
 */
async function demonstrateEnhancedClaude() {
  try {
    console.log('Initializing enhanced Claude service...');
    
    // Create Claude service instance
    const claudeService = new ClaudeService(process.env.CLAUDE_API_KEY, {
      defaultBlockchain: 'ethereum',
      useLangchain: true,
      useSolanaWeb3: true
    });
    
    // Create enhanced Claude service
    const enhancedClaude = new ClaudeEnhancer(claudeService, {
      useGptEngineer: true
    });
    
    console.log('Enhanced Claude service initialization completed');
    
    // Example 1: Using enhanced smart contract generation
    console.log('\nExample 1: Generate enhanced ERC20 token contract');
    const tokenDescription = 'Create an ERC20 token with staking functionality, allowing users to stake tokens and earn rewards';
    const enhancedContract = await claudeService.generateContract(
      tokenDescription,
      'token',
      { blockchain: 'ethereum' }
    );
    console.log('Generated contract code:\n', enhancedContract.substring(0, 500) + '...');
    
    // Example 2: Get blockchain design patterns
    console.log('\nExample 2: Get Ethereum security design patterns');
    const securityPatterns = claudeService.getBlockchainDesignPatterns('ethereum', 'security');
    console.log('Security design patterns:', securityPatterns);
    
    // Example 3: Using gpt-engineer to generate a project
    console.log('\nExample 3: Using gpt-engineer to generate NFT marketplace project');
    const nftMarketDescription = `
Create an NFT marketplace dApp with the following features:
1. Users can create, buy, and sell NFTs
2. Support for ERC721 and ERC1155 standards
3. Include search and filtering functionality
4. Support for royalty features
5. Integration with MetaMask wallet
`;
    
    console.log('Starting to generate NFT marketplace project...');
    await claudeService.generateWithGptEngineer(
      nftMarketDescription,
      'nft-marketplace',
      { blockchain: 'ethereum' }
    );
    console.log('NFT marketplace project generation completed');
    
  } catch (error) {
    console.error('Error during demonstration:', error);
  }
}

// If this file is run directly, execute the demonstration
if (require.main === module) {
  // Ensure API key is set
  if (!process.env.CLAUDE_API_KEY) {
    console.error('Error: Missing CLAUDE_API_KEY environment variable');
    process.exit(1);
  }
  
  demonstrateEnhancedClaude()
    .then(() => console.log('Demonstration completed'))
    .catch(error => console.error('Demonstration failed:', error));
}

module.exports = {
  demonstrateEnhancedClaude
};
