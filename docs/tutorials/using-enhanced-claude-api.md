# Using Enhanced Claude API

This tutorial will guide you through using the enhanced Claude API features in the 39B framework, including streaming responses, multi-modal input, smart contract optimization suggestions, and cross-chain compatibility checks.

## Prerequisites

- 39B framework installed
- Valid Claude API key
- Node.js 16.0.0 or higher

## Setting Up the Environment

First, make sure you have set up your environment variables:

```bash
# Set in .env file
CLAUDE_API_KEY=your_api_key
```

## Initializing Claude Service

```javascript
const ClaudeService = require('./src/core/claude');

// Initialize Claude service
const claudeService = new ClaudeService({
  apiKey: process.env.CLAUDE_API_KEY,
  model: 'claude-3-opus-20240229',  // Use the latest Claude model
  maxTokens: 4000,
  temperature: 0.7
});
```

## Basic Usage

The simplest usage is to directly call the API to generate code:

```javascript
// Basic call
const response = await claudeService.enhancedCallClaudeAPI(
  'Create a simple ERC20 token contract for Ethereum with minting and burning capabilities',
  {
    extractCode: true,  // Automatically extract code
    blockchainContext: 'ethereum'  // Specify blockchain context
  }
);

console.log('Generated code:');
console.log(response.code);
```

## Using Streaming Response

For longer responses, using streaming can provide a better user experience:

```javascript
// Streaming response
let streamedContent = '';

const streamResponse = await claudeService.enhancedCallClaudeAPI(
  'Create an SPL token program for Solana',
  {
    streamResponse: true,  // Enable streaming response
    blockchainContext: 'solana',
    extractCode: true,
    onStreamStart: () => console.log('Stream response started...'),
    onStreamUpdate: (chunk) => {
      streamedContent += chunk;
      process.stdout.write('.');  // Show progress
    },
    onStreamComplete: () => console.log('\nStream response completed')
  }
);

console.log('Generated code:');
console.log(streamResponse.code);
```

## Multi-Modal Input

You can combine text and images for input, for example, analyzing smart contract screenshots:

```javascript
// Read image file
const fs = require('fs');
const path = require('path');
const imageBuffer = fs.readFileSync(path.join(__dirname, 'contract-screenshot.png'));
const base64Image = imageBuffer.toString('base64');

// Multi-modal input
const multiModalResponse = await claudeService.enhancedCallClaudeAPI(
  {
    content: [
      { type: 'text', text: 'Analyze the security issues in this smart contract' },
      { 
        type: 'image', 
        source: { 
          type: 'base64', 
          media_type: 'image/png', 
          data: base64Image 
        } 
      }
    ]
  },
  {
    multiModal: true,
    blockchainContext: 'ethereum'
  }
);

console.log('Analysis results:');
console.log(multiModalResponse.text);
```

## Smart Contract Optimization Suggestions

You can use the enhanced API to get smart contract optimization suggestions:

```javascript
// Sample smart contract code
const sampleContract = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleStorage {
    uint256 private value;
    mapping(address => uint256) private userValues;
    
    event ValueChanged(address indexed user, uint256 newValue);
    
    function setValue(uint256 newValue) public {
        value = newValue;
        userValues[msg.sender] = newValue;
        emit ValueChanged(msg.sender, newValue);
    }
    
    function getValue() public view returns (uint256) {
        return value;
    }
    
    function getUserValue(address user) public view returns (uint256) {
        return userValues[user];
    }
}`;

// Get optimization suggestions
const optimizationResponse = await claudeService.enhancedCallClaudeAPI(
  `Analyze and optimize the following smart contract:\n\n${sampleContract}`,
  {
    blockchainContext: 'ethereum',
    extractCode: true,
    generateContractOptimizationSuggestions: true
  }
);

console.log('Optimization suggestions:');
console.log(optimizationResponse.optimizationSuggestions);

console.log('Optimized code:');
console.log(optimizationResponse.code);
```

## Cross-Chain Compatibility Check

You can check smart contract compatibility across different blockchains:

```javascript
// Sample Ethereum token contract
const ethereumContract = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is ERC20, Ownable {
    constructor() ERC20("MyToken", "MTK") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }
    
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}`;

// Check cross-chain compatibility
const compatibilityResponse = await claudeService.enhancedCallClaudeAPI(
  `Check the cross-chain compatibility of the following Ethereum contract and provide necessary modifications for deployment on BNB Chain and Base Chain:\n\n${ethereumContract}`,
  {
    checkCrossChainCompatibility: true,
    blockchainContext: 'ethereum',
    crossChainTargets: ['bnbchain', 'base']
  }
);

console.log('Cross-chain compatibility analysis:');
console.log(compatibilityResponse.text);

if (compatibilityResponse.crossChainCompatibility) {
  for (const chain in compatibilityResponse.crossChainCompatibility) {
    console.log(`\n${chain} compatibility:`);
    console.log(`- Compatibility score: ${compatibilityResponse.crossChainCompatibility[chain].score}/10`);
    console.log(`- Main issues: ${compatibilityResponse.crossChainCompatibility[chain].issues.join(', ')}`);
    console.log(`- Suggested modifications: ${compatibilityResponse.crossChainCompatibility[chain].suggestions.join(', ')}`);
  }
}
```

## Advanced Error Handling

The enhanced API provides better error handling mechanisms:

```javascript
try {
  const response = await claudeService.enhancedCallClaudeAPI(
    'Create an ERC20 token contract for Ethereum',
    {
      extractCode: true,
      blockchainContext: 'ethereum',
      maxRetries: 3  // Set maximum retry attempts
    }
  );
  
  console.log('Generated code:');
  console.log(response.code);
} catch (error) {
  console.error('API call failed:');
  console.error(`- Error type: ${error.type}`);
  console.error(`- Error message: ${error.message}`);
  console.error(`- Error details: ${JSON.stringify(error.details)}`);
}
```

## Complete Example

Here's a complete example showing how to use various features of the enhanced Claude API:

```javascript
const fs = require('fs');
const path = require('path');
const ClaudeService = require('../core/claude');
require('dotenv').config();

async function main() {
  // Initialize Claude service
  const claudeService = new ClaudeService({
    apiKey: process.env.CLAUDE_API_KEY,
    model: 'claude-3-opus-20240229',
    maxTokens: 4000,
    temperature: 0.7
  });
  
  // Basic call
  console.log('1. Basic call example');
  const basicResponse = await claudeService.enhancedCallClaudeAPI(
    'Create an ERC20 token contract for Ethereum with minting and burning capabilities',
    {
      extractCode: true,
      blockchainContext: 'ethereum'
    }
  );
  
  // Save generated code
  const outputDir = path.join(__dirname, '../../output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(outputDir, 'ERC20Token.sol'), 
    basicResponse.code
  );
  
  console.log(`Code saved to: ${path.join(outputDir, 'ERC20Token.sol')}`);
  
  // More examples...
}

main().catch(console.error);
```

## Summary

The enhanced Claude API provides various advanced features that can help you develop Web3 projects more efficiently:

- Streaming response provides a better user experience
- Multi-modal input supports more complex interactions
- Smart contract optimization suggestions help improve code quality
- Cross-chain compatibility check simplifies multi-chain deployment

By using these features appropriately, you can significantly improve Web3 development efficiency and code quality.

## Next Steps

- Check [API Reference](../api-reference.md) for more detailed information
- Try [Cross-Chain DApp Tutorial](./cross-chain-dapp.md) to learn how to build cross-chain applications
- Explore [Smart Contract Optimization Techniques](./contract-optimization.md) to learn more about optimization methods
