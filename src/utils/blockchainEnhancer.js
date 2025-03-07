/**
 * Blockchain Enhancement Tool
 * Integrates gpt-engineer functionality to enhance blockchain-specific features of the Web3 project generation framework
 * Provides blockchain-specific context, smart contract templates, and code generation capabilities
 */

const path = require('path');
const fs = require('fs').promises;
const { spawn } = require('child_process');

// gpt-engineer path
const GPT_ENGINEER_PATH = path.join(__dirname, '../../gpt-engineer');

/**
 * Blockchain Enhancer Class
 * Provides blockchain-specific context and code generation capabilities
 */
class BlockchainEnhancer {
  /**
   * Initialize blockchain enhancer
   * @param {Object} options - configuration options
   */
  constructor(options = {}) {
    this.config = {
      gptEngineerPath: options.gptEngineerPath || GPT_ENGINEER_PATH,
      defaultBlockchain: options.defaultBlockchain || 'ethereum',
      useGptEngineer: options.useGptEngineer !== undefined ? options.useGptEngineer : true
    };
    
    // blockchain-specific design patterns
    this.designPatterns = {
      ethereum: {
        security: [
          {
            name: "Check-Effect-Interaction Mode",
            description: "First perform all checks, then modify state, then interact with external contracts",
            example: `function withdraw(uint256 amount) public {
  // Check
  require(balances[msg.sender] >= amount, "Insufficient balance");
  
  // Effect
  balances[msg.sender] -= amount;
  
  // Interaction
  (bool success, ) = msg.sender.call{value: amount}("");
  require(success, "Transfer failed");
}`
          },
          {
            name: "Reentrancy Lock",
            description: "Prevent reentrancy attacks with locking mechanism",
            example: `bool private locked;
            
modifier nonReentrant() {
  require(!locked, "Reentrant call");
  locked = true;
  _;
  locked = false;
}`
          }
        ],
        optimization: [
          {
            name: "Gas Optimization Storage Mode",
            description: "Optimize storage layout to reduce gas consumption",
            example: `// Pack multiple booleans into a single uint256
uint256 private _packedBooleans;

function setBool(uint8 index, bool value) internal {
  if (value) {
    _packedBooleans |= (1 << index);
  } else {
    _packedBooleans &= ~(1 << index);
  }
}`
          }
        ]
      },
      solana: {
        security: [
          {
            name: "Account Verification Mode",
            description: "Verify ownership and permissions of all incoming accounts",
            example: `// Anchor framework example
#[account]
pub struct MyAccount {
    pub authority: Pubkey,
    pub data: u64,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub my_account: Account<'info, MyAccount>,
    #[account(constraint = authority.key == my_account.authority)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}`
          }
        ],
        optimization: [
          {
            name: "Compute Budget Management",
            description: "Manage compute budget for Solana transactions",
            example: `// Request additional compute units
ComputeBudgetInstruction::set_compute_unit_limit(300_000)`
          }
        ]
      }
    };
    
    // blockchain-specific error handling patterns
    this.errorHandlingPatterns = {
      ethereum: [
        {
          name: "Custom Error",
          description: "Use custom error instead of require statement to save gas",
          example: `error InsufficientBalance(uint256 available, uint256 required);

function withdraw(uint256 amount) public {
  if (balances[msg.sender] < amount) {
    revert InsufficientBalance(balances[msg.sender], amount);
  }
  // ...
}`
        },
        {
          name: "Try-Catch Mode",
          description: "Use try-catch to handle external calls",
          example: `try externalContract.riskyCall() returns (uint256 result) {
  // Success handling
  return result;
} catch Error(string memory reason) {
  // Catch revert/require errors
  emit ErrorCaught(reason);
} catch (bytes memory) {
  // Catch other errors
  emit UnknownErrorCaught();
}`
        }
      ],
      solana: [
        {
          name: "Result Wrapper",
          description: "Use Result type to wrap potentially error-prone operations",
          example: `fn process_instruction(accounts: &[AccountInfo], data: &[u8]) -> ProgramResult {
  // Handle instruction
  if error_condition {
    return Err(ProgramError::InvalidArgument);
  }
  Ok(())
}`
        }
      ]
    };
  }
  
  /**
   * Get blockchain-specific design patterns
   * @param {string} blockchain - blockchain type (ethereum, solana)
   * @param {string} patternType - pattern type (security, optimization)
   * @returns {Array} - list of design patterns
   */
  getDesignPatterns(blockchain, patternType) {
    if (!this.designPatterns[blockchain]) {
      console.warn(`Blockchain ${blockchain} design pattern not found`);
      return [];
    }
    
    if (!this.designPatterns[blockchain][patternType]) {
      console.warn(`Blockchain ${blockchain} ${patternType} design pattern not found`);
      return [];
    }
    
    return this.designPatterns[blockchain][patternType];
  }
  
  /**
   * Get blockchain-specific error handling patterns
   * @param {string} blockchain - blockchain type (ethereum, solana)
   * @returns {Array} - list of error handling patterns
   */
  getErrorHandlingPatterns(blockchain) {
    if (!this.errorHandlingPatterns[blockchain]) {
      console.warn(`Blockchain ${blockchain} error handling pattern not found`);
      return [];
    }
    
    return this.errorHandlingPatterns[blockchain];
  }
  
  /**
   * Enhance smart contract generation prompt
   * @param {string} prompt - original prompt
   * @param {string} blockchain - blockchain type (ethereum, solana)
   * @param {string} contractType - contract type (token, nft, dapp)
   * @returns {string} - enhanced prompt
   */
  enhanceContractPrompt(prompt, blockchain, contractType) {
    // Add design pattern information
    const securityPatterns = this.getDesignPatterns(blockchain, 'security');
    const optimizationPatterns = this.getDesignPatterns(blockchain, 'optimization');
    const errorPatterns = this.getErrorHandlingPatterns(blockchain);
    
    let enhancedPrompt = prompt;
    
    // Add security design patterns
    if (securityPatterns.length > 0) {
      enhancedPrompt += "\n\nSecurity Design Patterns:\n";
      securityPatterns.forEach(pattern => {
        enhancedPrompt += `- ${pattern.name}: ${pattern.description}\n`;
      });
    }
    
    // Add optimization design patterns
    if (optimizationPatterns.length > 0) {
      enhancedPrompt += "\nOptimization Design Patterns:\n";
      optimizationPatterns.forEach(pattern => {
        enhancedPrompt += `- ${pattern.name}: ${pattern.description}\n`;
      });
    }
    
    // Add error handling patterns
    if (errorPatterns.length > 0) {
      enhancedPrompt += "\nError Handling Patterns:\n";
      errorPatterns.forEach(pattern => {
        enhancedPrompt += `- ${pattern.name}: ${pattern.description}\n`;
      });
    }
    
    // Add specific guidance based on contract type
    if (contractType === 'token') {
      if (blockchain === 'ethereum') {
        enhancedPrompt += "\nEnsure complete ERC20 interface implementation, including transfer, authorization, and events.";
      } else if (blockchain === 'solana') {
        enhancedPrompt += "\nEnsure following SPL Token standard, implement minting, transferring, and freezing functionality.";
      }
    } else if (contractType === 'nft') {
      if (blockchain === 'ethereum') {
        enhancedPrompt += "\nEnsure complete ERC721 interface implementation, including metadata, transfer, and authorization functionality.";
      } else if (blockchain === 'solana') {
        enhancedPrompt += "\nEnsure following Metaplex NFT standard, implement metadata and minting functionality.";
      }
    }
    
    return enhancedPrompt;
  }
  
  /**
   * Use gpt-engineer to generate code
   * @param {string} description - project description
   * @param {string} outputDir - output directory
   * @param {Object} options - other options
   * @returns {Promise<string>} - generation result
   */
  async generateWithGptEngineer(description, outputDir, options = {}) {
    if (!this.config.useGptEngineer) {
      throw new Error("GPT Engineer functionality not enabled");
    }
    
    // Create project directory
    try {
      await fs.mkdir(path.join(this.config.gptEngineerPath, 'projects', outputDir), { recursive: true });
    } catch (error) {
      console.error("Project directory creation failed:", error);
      throw error;
    }
    
    // Create project description file
    try {
      await fs.writeFile(
        path.join(this.config.gptEngineerPath, 'projects', outputDir, 'prompt'),
        description
      );
    } catch (error) {
      console.error("Project description file creation failed:", error);
      throw error;
    }
    
    // Run gpt-engineer
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', [
        '-m', 'gpt_engineer.cli',
        'projects/' + outputDir,
        '--steps', 'generate'
      ], {
        cwd: this.config.gptEngineerPath,
        env: { ...process.env }
      });
      
      let output = '';
      
      pythonProcess.stdout.on('data', (data) => {
        const chunk = data.toString();
        output += chunk;
        console.log(chunk);
      });
      
      pythonProcess.stderr.on('data', (data) => {
        console.error(`GPT Engineer error: ${data}`);
      });
      
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`GPT Engineer process exited, code: ${code}`));
          return;
        }
        
        resolve(output);
      });
    });
  }
  
  /**
   * Copy generated code to target directory
   * @param {string} sourceDir - source directory
   * @param {string} targetDir - target directory
   * @returns {Promise<void>}
   */
  async copyGeneratedCode(sourceDir, targetDir) {
    const source = path.join(this.config.gptEngineerPath, 'projects', sourceDir, 'workspace');
    
    try {
      // Read generated files
      const files = await fs.readdir(source);
      
      // Ensure target directory exists
      await fs.mkdir(targetDir, { recursive: true });
      
      // Copy each file
      for (const file of files) {
        const sourcePath = path.join(source, file);
        const targetPath = path.join(targetDir, file);
        
        const stat = await fs.stat(sourcePath);
        
        if (stat.isDirectory()) {
          // Recursively copy directory
          await this.copyGeneratedCode(
            path.join(sourceDir, 'workspace', file),
            path.join(targetDir, file)
          );
        } else {
          // Copy file
          await fs.copyFile(sourcePath, targetPath);
        }
      }
    } catch (error) {
      console.error("Failed to copy generated code:", error);
      throw error;
    }
  }
}

module.exports = BlockchainEnhancer;
