/**
 * Claude API Extensions
 * Provides additional advanced features to enhance Claude API calls and response processing
 */

// Import required dependencies
const { Anthropic } = require('@anthropic-ai/sdk');

/**
 * Stream Response Handler
 * Handles streaming responses from Claude API
 * @param {Object} options - Stream response options
 * @param {Function} options.onMessageStart - Callback when message starts
 * @param {Function} options.onMessageUpdate - Callback when message updates
 * @param {Function} options.onMessageComplete - Callback when message completes
 * @param {Function} options.onError - Error handling callback
 * @returns {Object} - Stream response handler
 */
function createStreamHandler(options = {}) {
  const {
    onMessageStart = () => {},
    onMessageUpdate = () => {},
    onMessageComplete = () => {},
    onError = () => {}
  } = options;

  let messageContent = '';

  return {
    handleChunk: (chunk) => {
      try {
        if (chunk.type === 'message_start') {
          onMessageStart(chunk);
        } else if (chunk.type === 'content_block_delta') {
          messageContent += chunk.delta.text;
          onMessageUpdate(messageContent, chunk);
        } else if (chunk.type === 'message_stop') {
          onMessageComplete(messageContent);
        }
      } catch (error) {
        onError(error);
      }
    },
    getMessageContent: () => messageContent
  };
}

/**
 * Advanced Code Extractor
 * Extracts code blocks of different languages from Claude responses
 * @param {string} response - Claude response text
 * @param {Object} options - Extraction options
 * @returns {Object} - Extracted code blocks
 */
function extractCodeBlocks(response, options = {}) {
  const {
    languages = null,
    extractComments = true,
    groupByLanguage = false
  } = options;

  const codeBlocks = [];
  const languagePattern = languages ? `(?:${languages.join('|')})` : '\\w+';
  const codeRegex = new RegExp(`\`\`\`(?:${languagePattern})?\\n([\\s\\S]*?)\\n\`\`\``, 'g');
  
  let match;
  while ((match = codeRegex.exec(response)) !== null) {
    const codeBlock = {
      language: (match[0].match(/```(\w+)/)?.[1] || 'text').toLowerCase(),
      code: match[1]
    };
    
    // Remove comments if not needed
    if (!extractComments) {
      codeBlock.code = codeBlock.code
        .replace(/\/\/.*$/gm, '') // Remove single-line comments
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
        .replace(/^\s*\n/gm, ''); // Remove empty lines
    }
    
    codeBlocks.push(codeBlock);
  }
  
  // Group by language
  if (groupByLanguage && codeBlocks.length > 0) {
    return codeBlocks.reduce((grouped, block) => {
      if (!grouped[block.language]) {
        grouped[block.language] = [];
      }
      grouped[block.language].push(block.code);
      return grouped;
    }, {});
  }
  
  return codeBlocks;
}

/**
 * Response Validator
 * Validates the quality and completeness of Claude responses
 * @param {string} response - Claude response text
 * @param {Object} criteria - Validation criteria
 * @returns {Object} - Validation results
 */
function validateResponse(response, criteria = {}) {
  const {
    minLength = 0,
    maxLength = Infinity,
    requiredPatterns = [],
    forbiddenPatterns = [],
    requiredSections = []
  } = criteria;
  
  const validationResults = {
    isValid: true,
    issues: []
  };
  
  // Check length
  if (response.length < minLength) {
    validationResults.isValid = false;
    validationResults.issues.push(`Response length (${response.length}) is less than minimum required (${minLength})`);
  }
  
  if (response.length > maxLength) {
    validationResults.isValid = false;
    validationResults.issues.push(`Response length (${response.length}) exceeds maximum limit (${maxLength})`);
  }
  
  // Check required patterns
  for (const pattern of requiredPatterns) {
    const regex = new RegExp(pattern.regex, pattern.flags || '');
    if (!regex.test(response)) {
      validationResults.isValid = false;
      validationResults.issues.push(`Missing required pattern: ${pattern.description || pattern.regex}`);
    }
  }
  
  // Check forbidden patterns
  for (const pattern of forbiddenPatterns) {
    const regex = new RegExp(pattern.regex, pattern.flags || '');
    if (regex.test(response)) {
      validationResults.isValid = false;
      validationResults.issues.push(`Contains forbidden pattern: ${pattern.description || pattern.regex}`);
    }
  }
  
  // Check required sections
  for (const section of requiredSections) {
    const sectionRegex = new RegExp(section.regex, section.flags || '');
    if (!sectionRegex.test(response)) {
      validationResults.isValid = false;
      validationResults.issues.push(`Missing required section: ${section.name}`);
    }
  }
  
  return validationResults;
}

/**
 * Blockchain Knowledge Base
 * Provides blockchain-specific knowledge
 */
const blockchainKnowledgeBase = {
  ethereum: {
    securityBestPractices: `
      # Ethereum Smart Contract Security Best Practices
      
      ## Common Vulnerabilities
      - Reentrancy
      - Integer Overflow/Underflow
      - Front-running
      - Access Control Issues
      - Improper Randomness
      
      ## Security Patterns
      - Checks-Effects-Interactions Pattern
      - Pull over Push Pattern
      - Emergency Stop Pattern
      
      ## Audit Tools
      - Slither
      - MythX
      - Echidna
    `,
    contractTemplates: {
      erc20: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CustomToken is ERC20, Ownable {
    constructor(string memory name, string memory symbol, uint256 initialSupply) 
        ERC20(name, symbol) 
        Ownable(msg.sender)
    {
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }
    
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}`,
      erc721: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract CustomNFT is ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;
    
    string private _baseTokenURI;
    
    constructor(string memory name, string memory symbol, string memory baseURI) 
        ERC721(name, symbol) 
        Ownable(msg.sender)
    {
        _baseTokenURI = baseURI;
    }
    
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
    
    function setBaseURI(string memory baseURI) public onlyOwner {
        _baseTokenURI = baseURI;
    }
    
    function mint(address to) public onlyOwner {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
    }
}`
    }
  },
  solana: {
    securityBestPractices: `
      # Solana Program Security Best Practices
      
      ## Common Vulnerabilities
      - Improper Signature Verification
      - Insufficient Account Validation
      - Missing Permission Checks
      - Arithmetic Overflow
      
      ## Security Patterns
      - Account Validation Pattern
      - Signer Verification Pattern
      - Program Derived Addresses (PDAs)
      
      ## Audit Tools
      - Soteria
      - Anchor Test Framework
      - Solana Program Security Checklist
    `,
    contractTemplates: {
      token: `use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};

#[program]
pub mod token_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, decimals: u8) -> Result<()> {
        let mint_info = &ctx.accounts.mint;
        let mint_authority_info = &ctx.accounts.mint_authority;
        let rent = Rent::get()?;
        
        token::initialize_mint(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::InitializeMint {
                    mint: mint_info.to_account_info(),
                    rent: ctx.accounts.rent.to_account_info(),
                },
            ),
            decimals,
            mint_authority_info.key,
            Some(mint_authority_info.key),
        )?;
        
        Ok(())
    }
    
    pub fn mint_tokens(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.token_account.to_account_info(),
                    authority: ctx.accounts.mint_authority.to_account_info(),
                },
                &[],
            ),
            amount,
        )?;
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    pub mint_authority: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,
    pub mint_authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}`
    }
  }
};

/**
 * Advanced Error Handling and Logging
 * @param {Error} error - Error object
 * @param {Object} context - Error context
 * @returns {Object} - Formatted error information
 */
function handleApiError(error, context = {}) {
  // Extract API-specific error information
  const errorInfo = {
    message: error.message,
    type: error.name,
    timestamp: new Date().toISOString(),
    context: { ...context },
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  };
  
  // Specific API error handling
  if (error.status) {
    errorInfo.statusCode = error.status;
  }
  
  if (error.response) {
    errorInfo.apiResponse = {
      status: error.response.status,
      statusText: error.response.statusText,
      data: error.response.data
    };
  }
  
  // Provide suggestions based on error type
  if (error.message.includes('rate limit')) {
    errorInfo.suggestion = 'You have reached the API rate limit. Please try again later or reduce request frequency.';
  } else if (error.message.includes('token')) {
    errorInfo.suggestion = 'Please check if your API key is valid and not expired.';
  } else if (error.message.includes('timeout')) {
    errorInfo.suggestion = 'Request timed out. Please check your network connection or try again later.';
  }
  
  // Record error
  console.error('Claude API Error:', JSON.stringify(errorInfo, null, 2));
  
  return errorInfo;
}

/**
 * Multi-Modal Input Processor
 * Handles multi-modal inputs containing text and images
 * @param {Object|Array|string} input - Input content
 * @param {Object} options - Processing options
 * @returns {Array} - Formatted multi-modal content array
 */
function processMultiModalInput(input, options = {}) {
  const {
    validateImages = true,
    maxImageSize = 5 * 1024 * 1024, // 5MB
    allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif']
  } = options;

  // If input is a string, return text content directly
  if (typeof input === 'string') {
    return [{ type: 'text', content: input }];
  }

  // If input is already a formatted content array, validate and return
  if (Array.isArray(input)) {
    return validateContentArray(input, options);
  }

  // Process object form input
  const result = [];

  // Add text content
  if (input.text) {
    result.push({ type: 'text', content: input.text });
  }

  // Process image content
  if (input.images) {
    // Validate image format
    if (validateImages) {
      validateImageContent(input.images, { maxImageSize, allowedImageTypes });
    }

    input.images.forEach(image => {
      result.push({
        type: 'image',
        content: image
      });
    });
  }

  return result;
}

/**
 * Get Image Format
 * @param {string} source - Image source (URL, path, or data)
 * @returns {string} - Image format
 */
function getImageFormat(source) {
  if (!source) return null;

  // Extract format from Data URL
  if (source.startsWith('data:')) {
    const match = source.match(/^data:image\/(\w+);/);
    return match ? match[1] : null;
  }

  // Extract extension from URL or file path
  const match = source.match(/\.(\w+)$/);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Advanced Response Processor
 * Post-processes and enhances Claude responses
 * @param {string} response - Claude response text
 * @param {Object} options - Processing options
 * @returns {Object} - Processed response
 */
function processResponse(response, options = {}) {
  const {
    formatMarkdown = true,
    extractSections = true,
    addMetadata = true,
    estimateReadingTime = true
  } = options;

  let processedResponse = {
    original: response,
    processed: response
  };

  // Format Markdown
  if (formatMarkdown) {
    processedResponse.processed = formatMarkdownContent(processedResponse.processed);
  }

  // Ensure proper code block formatting
  processedResponse.processed = processedResponse.processed
    .replace(/```(\w+)\s*\n/g, '```$1\n')
    .replace(/```\s*\n/g, '```text\n');

  // Remove extra blank lines
  processedResponse.processed = processedResponse.processed
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Extract sections
  if (extractSections) {
    processedResponse.sections = extractContentSections(processedResponse.processed);
  }

  // Add metadata
  if (addMetadata) {
    processedResponse.metadata = {
      timestamp: new Date().toISOString(),
      length: response.length,
      wordCount: response.split(/\s+/).length,
      // Estimate reading time
      readingTime: estimateReadingTime ? 
        Math.ceil(response.split(/\s+/).length / 200) : null // Assuming 200 words per minute
    };
  }

  return processedResponse;
}

/**
 * Smart Contract Optimization Suggestions Generator
 * Analyzes smart contract code and provides optimization suggestions
 * @param {string} contractCode - Smart contract code
 * @param {string} blockchain - Blockchain type
 * @returns {Object} - Optimization suggestions
 */
function generateContractOptimizationSuggestions(contractCode, blockchain = 'ethereum') {
  const suggestions = {
    security: [],
    gas: [],
    performance: []
  };

  // Apply different analysis rules based on blockchain type
  if (blockchain === 'ethereum') {
    // Security suggestions
    if (contractCode.includes('selfdestruct')) {
      suggestions.security.push('Using selfdestruct function poses security risks, consider implementing a safer contract upgrade pattern');
    }
    
    if (contractCode.includes('tx.origin')) {
      suggestions.security.push('Using tx.origin for authentication is vulnerable to phishing attacks, use msg.sender instead');
    }

    // Gas optimization suggestions
    if (contractCode.includes('uint256')) {
      suggestions.gas.push('Consider using uint128 or smaller if the value range allows it to save gas');
    }

    // Performance suggestions
    if (contractCode.includes('for (')) {
      suggestions.performance.push('Consider implementing batch processing for large loops to improve performance');
    }
  } else if (blockchain === 'solana') {
    // Solana-specific suggestions
    suggestions.security.push('Ensure proper account validation using Account Info structs');
    suggestions.performance.push('Use Program Derived Addresses (PDAs) for deterministic account generation');
  }

  return suggestions;
}

/**
 * Cross-Chain Compatibility Checker
 * Checks code compatibility across different blockchains
 * @param {string} code - Code to check
 * @param {Array<string>} targetBlockchains - List of target blockchains
 * @returns {Object} - Compatibility report
 */
function checkCrossChainCompatibility(code, targetBlockchains = []) {
  const compatibility = {};
  const issues = {};
  
  // Check compatibility for each target blockchain
  for (const blockchain of targetBlockchains) {
    compatibility[blockchain] = true; // Default compatibility
    issues[blockchain] = [];
    
    // Check Ethereum-series blockchains for specific issues
    if (['ethereum', 'polygon', 'base', 'arbitrum', 'optimism', 'bnbchain'].includes(blockchain)) {
      // Check Solana-specific code
      if (code.includes('solana') || code.includes('anchor') || 
          code.includes('#[program]') || code.includes('Pubkey')) {
        compatibility[blockchain] = false;
        issues[blockchain].push('Code includes Solana-specific syntax or library, not compatible with Ethereum-series blockchains');
      }
      
      // Check Ethereum-specific gas issues
      if (blockchain !== 'ethereum' && code.includes('gasleft()')) {
        issues[blockchain].push('Using gasleft() function may behave differently on L2 solutions');
      }
    }
    
    // Check Solana-specific issues
    if (blockchain === 'solana') {
      // Check Ethereum-specific code
      if (code.includes('ethereum') || code.includes('web3') || 
          code.includes('solidity') || code.includes('msg.sender')) {
        compatibility[blockchain] = false;
        issues[blockchain].push('Code includes Ethereum-specific syntax or library, not compatible with Solana');
      }
    }
  }
  
  return {
    compatibility,
    issues,
    summary: Object.entries(compatibility)
      .map(([chain, isCompatible]) => `${chain}: ${isCompatible ? 'Compatible' : 'Not Compatible'}`)
      .join(', ')
  };
}

// Export all features
module.exports = {
  createStreamHandler,
  extractCodeBlocks,
  validateResponse,
  blockchainKnowledgeBase,
  handleApiError,
  processMultiModalInput,
  processResponse,
  generateContractOptimizationSuggestions,
  checkCrossChainCompatibility
};
