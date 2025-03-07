/**
 * Template Manager
 * Manages Web3 templates for smart contracts, frontend components, and project structures
 */

const fs = require('fs').promises;
const path = require('path');

class TemplateManager {
  constructor(templatesDir) {
    this.templatesDir = templatesDir || path.join(process.cwd(), 'src', 'templates');
    this.categories = {
      contracts: path.join(this.templatesDir, 'contracts'),
      frontend: path.join(this.templatesDir, 'frontend'),
      projects: path.join(this.templatesDir, 'projects'),
    };
  }

  /**
   * Initialize template manager, ensuring template directories exist
   */
  async initialize() {
    try {
      // Ensure all template directories exist
      for (const category in this.categories) {
        try {
          await fs.access(this.categories[category]);
        } catch (err) {
          // Directory doesn't exist, create it
          await fs.mkdir(this.categories[category], { recursive: true });
          console.log(`Created template directory: ${this.categories[category]}`);
        }
      }
      
      // Check if we need to create default templates
      const contractTemplates = await this.getTemplates('contracts');
      if (contractTemplates.length === 0) {
        await this.createDefaultTemplates();
      }
      
      // Validate existing templates
      await this.validateExistingTemplates();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize template manager:', error);
      return false;
    }
  }
  
  /**
   * Validates all existing templates and logs any issues
   * @returns {Promise<Object>} - Summary of validation results
   */
  async validateExistingTemplates() {
    const results = {
      valid: 0,
      warnings: 0,
      errors: 0,
      details: {}
    };
    
    try {
      for (const category in this.categories) {
        const templates = await this.getTemplates(category);
        results.details[category] = {};
        
        for (const template of templates) {
          const validation = await this.validateTemplate(category, template);
          
          results.details[category][template] = validation;
          
          if (validation.isValid) {
            results.valid++;
          }
          
          if (validation.warnings.length > 0) {
            results.warnings++;
          }
          
          if (validation.errors.length > 0) {
            results.errors++;
            console.error(`Template validation failed for ${category}/${template}:`, validation.errors);
          }
        }
      }
      
      console.log(`Template validation complete: ${results.valid} valid templates, ${results.warnings} with warnings, ${results.errors} with errors`);
      return results;
    } catch (error) {
      console.error('Template validation failed:', error);
      return results;
    }
  }

  /**
   * Get list of available templates by category
   * @param {string} category - Template category (contracts, frontend, projects)
   * @returns {Promise<Array>} - List of available templates
   */
  async getTemplates(category) {
    if (!this.categories[category]) {
      throw new Error(`Invalid template category: ${category}`);
    }

    try {
      const files = await fs.readdir(this.categories[category]);
      return files.filter(file => !file.startsWith('.'));
    } catch (error) {
      console.error(`Failed to get ${category} templates:`, error);
      return [];
    }
  }
  
  /**
   * Refresh templates from disk
   * Useful when templates are updated externally or programmatically
   * @returns {Promise<Object>} - Object with template counts by category
   */
  async refreshTemplates() {
    const results = {};
    
    try {
      for (const category in this.categories) {
        try {
          const templates = await this.getTemplates(category);
          results[category] = templates.length;
        } catch (error) {
          console.error(`Failed to refresh ${category} templates:`, error);
          results[category] = 0;
        }
      }
      
      return results;
    } catch (error) {
      console.error('Failed to refresh templates:', error);
      return {};
    }
  }

  /**
   * Get template content
   * @param {string} category - Template category
   * @param {string} templateName - Template name
   * @returns {Promise<string>} - Template content
   */
  async getTemplateContent(category, templateName) {
    if (!this.categories[category]) {
      throw new Error(`Invalid template category: ${category}`);
    }

    const templatePath = path.join(this.categories[category], templateName);
    
    try {
      return await fs.readFile(templatePath, 'utf8');
    } catch (error) {
      console.error(`Failed to read template ${templateName}:`, error);
      throw new Error(`Template ${templateName} not found`);
    }
  }
  
  /**
   * Validate a template by checking for required elements
   * @param {string} category - Template category
   * @param {string} templateName - Template name
   * @returns {Promise<Object>} - Validation results with isValid flag and any errors
   */
  async validateTemplate(category, templateName) {
    const result = {
      isValid: false,
      errors: [],
      warnings: []
    };
    
    try {
      // Check if template exists
      const content = await this.getTemplateContent(category, templateName);
      
      // Validate based on category
      if (category === 'contracts') {
        // Check for SPDX license identifier
        if (!content.includes('SPDX-License-Identifier:')) {
          result.warnings.push('Missing SPDX license identifier');
        }
        
        // Check for pragma solidity statement
        if (!content.includes('pragma solidity')) {
          result.errors.push('Missing pragma solidity statement');
        }
        
        // Check for contract definition
        if (!content.includes('contract ')) {
          result.errors.push('Missing contract definition');
        }
      } else if (category === 'frontend') {
        // Check for React import for frontend components
        if (!content.includes('import React')) {
          result.warnings.push('Missing React import');
        }
        
        // Check for component export
        if (!content.includes('export default')) {
          result.warnings.push('Missing export default statement');
        }
      } else if (category === 'projects') {
        // For project templates (JSON), try to parse the JSON
        try {
          const parsed = JSON.parse(content);
          
          // Check for required project template fields
          if (!parsed.name) {
            result.errors.push('Missing project name');
          }
          
          if (!parsed.structure) {
            result.errors.push('Missing project structure');
          }
        } catch (jsonError) {
          result.errors.push(`Invalid JSON format: ${jsonError.message}`);
        }
      }
      
      // Mark as valid if no errors (warnings are acceptable)
      result.isValid = result.errors.length === 0;
      
      return result;
    } catch (error) {
      result.errors.push(`Validation failed: ${error.message}`);
      return result;
    }
  }

  /**
   * Creates default templates for newly initialized systems
   */
  async createDefaultTemplates() {
    // Create sample ERC20 contract template
    const erc20Template = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract {{TokenName}} is ERC20, Ownable {
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address initialOwner
    ) ERC20(name, symbol) Ownable(initialOwner) {
        _mint(initialOwner, initialSupply * 10 ** decimals());
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}`;

    // Create sample ERC721 (NFT) contract template
    const erc721Template = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract {{CollectionName}} is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    
    uint256 public mintPrice = {{MintPrice}}; // Price in Wei
    uint256 public maxSupply = {{MaxSupply}};
    string public baseURI = "{{BaseURI}}";

    constructor(
        string memory name,
        string memory symbol,
        address initialOwner
    ) ERC721(name, symbol) Ownable(initialOwner) {}

    function mintNFT(address recipient, string memory tokenURI)
        public payable returns (uint256)
    {
        require(_tokenIds.current() < maxSupply, "Max supply reached");
        require(msg.value >= mintPrice, "Insufficient payment");
        
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        _mint(recipient, newItemId);
        _setTokenURI(newItemId, tokenURI);

        return newItemId;
    }
    
    function setMintPrice(uint256 _mintPrice) public onlyOwner {
        mintPrice = _mintPrice;
    }
    
    function setMaxSupply(uint256 _maxSupply) public onlyOwner {
        maxSupply = _maxSupply;
    }
    
    function withdraw() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}`;

    // Create a sample React wallet connection component
    const walletConnectorTemplate = `import React, { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';

const WalletConnector = () => {
  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState(null);
  const [network, setNetwork] = useState('{{Network}}');
  
  const connectWallet = async () => {
    try {
      // Check if Phantom is installed
      const provider = window?.phantom?.solana;
      
      if (!provider?.isPhantom) {
        alert('Phantom wallet is not installed. Please install it from https://phantom.app/');
        return;
      }
      
      // Connect to wallet
      const response = await provider.connect();
      setWallet(response.publicKey.toString());
      
      // Get account balance
      const connection = new Connection(
        network === 'mainnet' ? 'https://api.mainnet-beta.solana.com' : 'https://api.devnet.solana.com',
        'confirmed'
      );
      
      const balance = await connection.getBalance(new PublicKey(response.publicKey.toString()));
      setBalance(balance / 1000000000); // Convert lamports to SOL
    } catch (error) {
      console.error('Error connecting to wallet:', error);
    }
  };
  
  const disconnectWallet = () => {
    window?.phantom?.solana?.disconnect();
    setWallet(null);
    setBalance(null);
  };
  
  return (
    <div className="wallet-connector">
      <h2>Wallet Connection</h2>
      
      <div className="network-selector">
        <label>
          Network:
          <select value={network} onChange={(e) => setNetwork(e.target.value)}>
            <option value="mainnet">Mainnet</option>
            <option value="devnet">Devnet</option>
          </select>
        </label>
      </div>
      
      {!wallet ? (
        <button onClick={connectWallet} className="connect-button">
          Connect Wallet
        </button>
      ) : (
        <div className="wallet-info">
          <p>
            <strong>Connected:</strong> {wallet.substring(0, 4)}...{wallet.substring(wallet.length - 4)}
          </p>
          <p>
            <strong>Balance:</strong> {balance !== null ? \`\${balance} SOL\` : 'Loading...'}
          </p>
          <button onClick={disconnectWallet} className="disconnect-button">
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletConnector;`;

    // Create sample project structure template (JSON format)
    const basicProjectTemplate = {
      name: "Basic Web3 Project",
      description: "A simple Web3 project template with contract and frontend",
      structure: {
        "contracts": {
          "Token.sol": "{{TokenContract}}"
        },
        "frontend": {
          "src": {
            "components": {
              "WalletConnector.jsx": "{{WalletConnector}}",
              "TokenInfo.jsx": "// Token info component"
            },
            "pages": {
              "index.js": "// Main page"
            },
            "styles": {
              "globals.css": "/* Global styles */"
            }
          },
          "public": {
            "favicon.ico": null
          }
        },
        "scripts": {
          "deploy.js": "// Contract deployment script"
        },
        "README.md": "# {{ProjectName}}\n\n{{ProjectDescription}}"
      }
    };

    try {
      // Save contract templates
      await fs.writeFile(path.join(this.categories.contracts, 'ERC20.sol'), erc20Template);
      await fs.writeFile(path.join(this.categories.contracts, 'ERC721.sol'), erc721Template);
      
      // Save frontend template
      await fs.writeFile(path.join(this.categories.frontend, 'WalletConnector.jsx'), walletConnectorTemplate);
      
      // Save project template
      await fs.writeFile(
        path.join(this.categories.projects, 'basic-web3-project.json'), 
        JSON.stringify(basicProjectTemplate, null, 2)
      );
      
      console.log('Default templates created successfully');
    } catch (error) {
      console.error('Failed to create default templates:', error);
    }
  }
  
  /**
   * Add a new template to the system
   * @param {string} category - Template category
   * @param {string} templateName - Template name
   * @param {string} content - Template content
   * @param {boolean} validate - Whether to validate the template before adding
   * @returns {Promise<Object>} - Result of the operation
   */
  async addTemplate(category, templateName, content, validate = true) {
    if (!this.categories[category]) {
      throw new Error(`Invalid template category: ${category}`);
    }
    
    try {
      // Validate if requested
      if (validate) {
        // Write to temporary file for validation
        const tempPath = path.join(this.categories[category], `.__temp_${templateName}`);
        await fs.writeFile(tempPath, content);
        
        try {
          // Validate the template
          const validation = await this.validateTemplate(category, `.__temp_${templateName}`);
          
          // Remove temporary file
          await fs.unlink(tempPath);
          
          // If validation failed, return the validation results
          if (!validation.isValid) {
            return {
              success: false,
              message: 'Template validation failed',
              validation
            };
          }
        } catch (validationError) {
          // Clean up temp file if it exists
          try {
            await fs.unlink(tempPath);
          } catch (cleanupError) {
            // Ignore cleanup errors
          }
          
          throw validationError;
        }
      }
      
      // Write the template file
      const templatePath = path.join(this.categories[category], templateName);
      await fs.writeFile(templatePath, content);
      
      return {
        success: true,
        message: `Template ${category}/${templateName} added successfully`
      };
    } catch (error) {
      console.error(`Failed to add template ${category}/${templateName}:`, error);
      
      return {
        success: false,
        message: `Failed to add template: ${error.message}`
      };
    }
  }
}

module.exports = TemplateManager;
