/**
 * Enhanced Claude API Feature Demo
 * Demonstrates how to use the enhanced features of ClaudeService
 */

require('dotenv').config();
const ClaudeService = require('../core/claude');
const fs = require('fs');
const path = require('path');

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
  console.log('Starting Enhanced Claude API Feature Demo...');
  
  // Create Claude service
  const claudeService = new ClaudeService({
    apiKey: process.env.CLAUDE_API_KEY,
    model: 'claude-3-opus-20240229',
    maxTokens: 4000,
    temperature: 0.7
  });
  
  // Demo 1: Basic Call
  console.log('\nDemo 1: Basic Call');
  try {
    const basicResponse = await claudeService.enhancedCallClaudeAPI(
      'Create a simple ERC20 token contract for Ethereum, including minting and burning functions',
      {
        extractCode: true,
        blockchainContext: 'ethereum'
      }
    );
    
    console.log('Basic Call Response:');
    console.log('- Text Length:', basicResponse.text?.length || 0);
    console.log('- Code Length:', basicResponse.code?.length || 0);
    
    // Save generated code to file
    if (basicResponse.code) {
      const outputDir = path.join(__dirname, '../../demo-output/enhanced-claude');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const outputPath = path.join(outputDir, 'ERC20Token.sol');
      fs.writeFileSync(outputPath, basicResponse.code);
      console.log(`Code saved to: ${outputPath}`);
    }
  } catch (error) {
    console.error('Basic call failed:', error);
  }
  
  // Demo 2: Stream Response
  console.log('\nDemo 2: Stream Response');
  try {
    let streamedContent = '';
    let chunkCount = 0;
    
    const streamResponse = await claudeService.enhancedCallClaudeAPI(
      'Create a simple SPL token program for Solana',
      {
        streamResponse: true,
        blockchainContext: 'solana',
        extractCode: true,
        onStreamStart: () => console.log('Stream response started...'),
        onStreamUpdate: (chunk) => {
          chunkCount++;
          streamedContent += chunk;
          console.log(`Received chunk #${chunkCount}: ${chunk.length} characters`);
        },
        onStreamComplete: () => console.log('Stream response completed')
      }
    );
    
    console.log('Stream Response Statistics:');
    console.log('- Total Chunks:', chunkCount);
    console.log('- Total Characters:', streamedContent.length);
    console.log('- Code Length:', streamResponse.code?.length || 0);
    
    // Save generated code to file
    if (streamResponse.code) {
      const outputDir = path.join(__dirname, '../../demo-output/enhanced-claude');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const outputPath = path.join(outputDir, 'SplToken.rs');
      fs.writeFileSync(outputPath, streamResponse.code);
      console.log(`Code saved to: ${outputPath}`);
    }
  } catch (error) {
    console.error('Stream response failed:', error);
  }
  
  // Demo 3: Smart Contract Optimization Suggestions
  console.log('\nDemo 3: Smart Contract Optimization Suggestions');
  try {
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
    
    const optimizationResponse = await claudeService.enhancedCallClaudeAPI(
      `Analyze and optimize the following smart contract:\n\n${sampleContract}`,
      {
        blockchainContext: 'ethereum',
        extractCode: true,
        generateContractOptimizationSuggestions: true
      }
    );
    
    console.log('Optimization Suggestions Response:');
    console.log('- Text Length:', optimizationResponse.text?.length || 0);
    console.log('- Optimized Code Length:', optimizationResponse.code?.length || 0);
    
    if (optimizationResponse.optimizationSuggestions) {
      console.log('\nOptimization Suggestions:');
      console.log(optimizationResponse.optimizationSuggestions);
    }
    
    // Save optimized code to file
    if (optimizationResponse.code) {
      const outputDir = path.join(__dirname, '../../demo-output/enhanced-claude');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const outputPath = path.join(outputDir, 'OptimizedSimpleStorage.sol');
      fs.writeFileSync(outputPath, optimizationResponse.code);
      console.log(`Optimized code saved to: ${outputPath}`);
    }
  } catch (error) {
    console.error('Optimization suggestions failed:', error);
  }
  
  // Demo 4: Cross-Chain Compatibility Check
  console.log('\nDemo 4: Cross-Chain Compatibility Check');
  try {
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
    
    const compatibilityResponse = await claudeService.enhancedCallClaudeAPI(
      `Check the cross-chain compatibility of the following Ethereum contract, and provide necessary modifications for deployment on BNB Chain and Base Chain:\n\n${ethereumContract}`,
      {
        checkCrossChainCompatibility: true,
        blockchainContext: 'ethereum',
        crossChainTargets: ['bnbchain', 'base']
      }
    );
    
    console.log('Cross-Chain Compatibility Check Response:');
    console.log('- Text Length:', compatibilityResponse.text?.length || 0);
    
    if (compatibilityResponse.crossChainCompatibility) {
      console.log('\nCross-Chain Compatibility Analysis:');
      const compatibility = compatibilityResponse.crossChainCompatibility;
      
      for (const chain in compatibility) {
        console.log(`\n${chain} Compatibility:`);
        console.log(`- Compatibility Score: ${compatibility[chain].score}/10`);
        console.log(`- Major Issues: ${compatibility[chain].issues.length}`);
        console.log(`- Suggested Modifications: ${compatibility[chain].suggestions.length}`);
      }
    }
    
    // Save cross-chain compatibility report to file
    if (compatibilityResponse.text) {
      const outputDir = path.join(__dirname, '../../demo-output/enhanced-claude');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const outputPath = path.join(outputDir, 'CrossChainCompatibilityReport.md');
      fs.writeFileSync(outputPath, compatibilityResponse.text);
      console.log(`Cross-chain compatibility report saved to: ${outputPath}`);
    }
  } catch (error) {
    console.error('Cross-chain compatibility check failed:', error);
  }
  
  console.log('\nDemo completed!');
}

// Run the demo
runDemo().catch(error => {
  console.error('Demo execution failed:', error);
});
