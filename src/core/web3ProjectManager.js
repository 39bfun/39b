/**
 * Web3 Project Manager
 * A unified entry point that integrates all components and provides a simple interface
 */

const { ClaudeService } = require('./claudeService');
const { ProjectGenerator } = require('./projectGenerator');
const { TemplateManager } = require('./templateManager');
const { ContractAnalyzer } = require('./contractAnalyzer');
const { TestRunner } = require('./testRunner');
const path = require('path');

/**
 * Initialize Web3 Project Manager
 * @param {Object} config - Configuration options
 */
class Web3ProjectManager {
  constructor(config = {}) {
    this.config = {
      claudeApiKey: config.claudeApiKey,
      templatePath: config.templatePath || './templates',
      outputPath: config.outputPath || './output',
      ...config
    };

    // Initialize components
    this.initialized = false;
    
    // Initialize Claude service
    this.claudeService = new ClaudeService({
      apiKey: this.config.claudeApiKey,
      model: this.config.model || 'claude-3-opus-20240229',
      temperature: this.config.temperature || 0.7,
      maxTokens: this.config.maxTokens || 4096
    });

    // Enhance Claude service
    this.claudeService.enhanceWithBlockchainContext({
      blockchainType: this.config.blockchainType || 'ethereum',
      contractStandards: this.config.contractStandards || ['ERC20', 'ERC721', 'ERC1155']
    });

    // Initialize project generator
    this.projectGenerator = new ProjectGenerator({
      templateManager: new TemplateManager(this.config.templatePath),
      outputPath: this.config.outputPath,
      claudeService: this.claudeService
    });

    // Supported blockchains
    this.supportedBlockchains = {
      ethereum: {
        name: 'Ethereum',
        standards: ['ERC20', 'ERC721', 'ERC1155', 'ERC4626'],
        tools: ['Hardhat', 'Foundry', 'Truffle'],
        languages: ['Solidity', 'Vyper'],
        testFrameworks: ['Mocha', 'Chai', 'Waffle']
      },
      solana: {
        name: 'Solana',
        standards: ['SPL Token', 'Metaplex NFT'],
        tools: ['Anchor', 'Native'],
        languages: ['Rust'],
        testFrameworks: ['Mocha', 'Chai']
      },
      polygon: {
        name: 'Polygon',
        standards: ['ERC20', 'ERC721', 'ERC1155'],
        tools: ['Hardhat', 'Truffle'],
        languages: ['Solidity'],
        testFrameworks: ['Mocha', 'Chai']
      }
    };

    // Test framework configuration
    this.testConfig = {
      ethereum: {
        defaultFramework: 'Hardhat',
        frameworks: {
          hardhat: {
            name: 'Hardhat',
            template: 'hardhat-test-template',
            dependencies: [
              'hardhat',
              '@nomiclabs/hardhat-ethers',
              '@nomiclabs/hardhat-waffle',
              'chai',
              'ethereum-waffle',
              'ethers'
            ]
          },
          foundry: {
            name: 'Foundry',
            template: 'foundry-test-template',
            dependencies: []
          },
          truffle: {
            name: 'Truffle',
            template: 'truffle-test-template',
            dependencies: [
              'truffle',
              '@truffle/contract',
              'chai'
            ]
          }
        }
      },
      solana: {
        defaultFramework: 'Anchor',
        frameworks: {
          anchor: {
            name: 'Anchor',
            template: 'anchor-test-template',
            dependencies: [
              '@project-serum/anchor',
              '@solana/web3.js',
              'mocha',
              'chai'
            ]
          },
          native: {
            name: 'Native',
            template: 'solana-native-test-template',
            dependencies: [
              '@solana/web3.js',
              'mocha',
              'chai'
            ]
          }
        }
      }
    };

    // Deployment configuration
    this.deployConfig = {
      ethereum: {
        mainnet: {
          name: 'Ethereum Mainnet',
          chainId: 1,
          rpcUrl: 'https://mainnet.infura.io/v3/${INFURA_API_KEY}'
        },
        goerli: {
          name: 'Goerli Testnet',
          chainId: 5,
          rpcUrl: 'https://goerli.infura.io/v3/${INFURA_API_KEY}'
        },
        sepolia: {
          name: 'Sepolia Testnet',
          chainId: 11155111,
          rpcUrl: 'https://sepolia.infura.io/v3/${INFURA_API_KEY}'
        }
      },
      solana: {
        mainnet: {
          name: 'Solana Mainnet',
          cluster: 'mainnet-beta',
          rpcUrl: 'https://api.mainnet-beta.solana.com'
        },
        devnet: {
          name: 'Solana Devnet',
          cluster: 'devnet',
          rpcUrl: 'https://api.devnet.solana.com'
        },
        testnet: {
          name: 'Solana Testnet',
          cluster: 'testnet',
          rpcUrl: 'https://api.testnet.solana.com'
        }
      }
    };
  }

  /**
   * Initialize project manager
   * @returns {Promise<boolean>} - Whether initialization was successful
   */
  async initialize() {
    try {
      // Initialize template manager
      await this.projectGenerator.templateManager.initialize();
      
      // Initialize project generator
      await this.projectGenerator.initialize();
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize Web3 Project Manager:', error);
      return false;
    }
  }

  /**
   * Generate a complete Web3 project
   * @param {string} projectName - Project name
   * @param {string} description - Project description
   * @param {Object} options - Project options
   * @returns {Promise<Object>} - Generation result
   */
  async generateProject(projectName, description, options = {}) {
    try {
      const blockchain = options.blockchain || this.config.blockchainType || 'ethereum';
      const projectType = options.projectType || 'dapp';
      const testFramework = options.testFramework || this.getSupportedTestFrameworks(blockchain)[0];
      const outputDir = options.outputDir || path.join(this.config.outputPath, projectName);
      
      console.log(`Starting to generate ${blockchain} ${projectType} project: ${projectName}`);
      
      // Verify blockchain support
      if (!this.supportedBlockchains[blockchain]) {
        throw new Error(`Unsupported blockchain: ${blockchain}`);
      }
      
      // Get blockchain-specific configuration
      const blockchainConfig = this.supportedBlockchains[blockchain];
      const testConfig = this.testConfig[blockchain];
      
      // Generate project structure
      const projectStructure = await this.projectGenerator.generateStructure({
        name: projectName,
        description,
        blockchain,
        type: projectType,
        standards: options.standards || blockchainConfig.standards,
        tools: options.tools || blockchainConfig.tools,
        testFramework,
        outputDir
      });
      
      // Generate smart contracts
      const contracts = await this.projectGenerator.generateContracts({
        projectStructure,
        blockchain,
        standards: options.standards || blockchainConfig.standards
      });
      
      // Generate tests
      const tests = await this.projectGenerator.generateTests({
        contracts,
        framework: testFramework,
        config: testConfig
      });
      
      // Generate documentation
      const docs = await this.projectGenerator.generateDocs({
        projectStructure,
        contracts,
        tests
      });
      
      return {
        success: true,
        projectPath: outputDir,
        structure: projectStructure,
        contracts,
        tests,
        docs
      };
    } catch (error) {
      console.error('Failed to generate project:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get supported blockchains
   * @returns {Array<string>} - List of supported blockchains
   */
  getSupportedBlockchains() {
    return this.supportedBlockchains;
  }

  /**
   * Get supported test frameworks
   * @param {string} blockchain - Blockchain type
   * @returns {Array<string>} - List of supported test frameworks
   */
  getSupportedTestFrameworks(blockchain) {
    if (!this.testConfig[blockchain]) {
      return [];
    }
    
    return Object.keys(this.testConfig[blockchain].frameworks);
  }

  /**
   * Get blockchain-specific configuration
   * @param {string} blockchain - Blockchain type
   * @returns {Object} - Blockchain configuration
   */
  getBlockchainConfig(blockchain) {
    if (!this.supportedBlockchains[blockchain]) {
      throw new Error(`Unsupported blockchain: ${blockchain}`);
    }
    
    // Get blockchain networks and contract types from Claude service
    const networks = this.claudeService.blockchainNetworks[blockchain] || {};
    const contractTypes = this.claudeService.contractTypes[blockchain] || {};
    
    return {
      networks,
      contractTypes,
      testFrameworks: this.testConfig[blockchain].frameworks || {},
      deploymentConfig: this.deployConfig[blockchain] || {}
    };
  }

  /**
   * Add blockchain tools to project
   * @param {string} projectDir - Project directory
   * @param {string} blockchain - Blockchain type
   * @returns {Promise<boolean>} - Whether it was successful
   */
  async addBlockchainTools(projectDir, blockchain) {
    try {
      if (!this.supportedBlockchains[blockchain]) {
        throw new Error(`Unsupported blockchain: ${blockchain}`);
      }
      
      let dependencies = {};
      let devDependencies = {};
      let scripts = {};
      let configFiles = [];
      
      // Add specific tools and libraries based on blockchain type
      switch (blockchain) {
        case 'ethereum':
          dependencies = {
            "ethers": "^6.9.0",
            "web3": "^4.3.0",
            "@openzeppelin/contracts": "^5.0.0",
            "wagmi": "^1.4.12",
            "viem": "^1.21.4"
          };
          devDependencies = {
            "hardhat": "^2.19.4",
            "@nomicfoundation/hardhat-toolbox": "^4.0.0"
          };
          scripts = {
            "compile:ethereum": "hardhat compile",
            "test:ethereum": "hardhat test",
            "deploy:ethereum": "hardhat run scripts/deploy.js"
          };
          configFiles = [
            { path: 'hardhat.config.js', template: 'ethereum/hardhat.config.js' }
          ];
          break;
          
        case 'solana':
          dependencies = {
            "@solana/web3.js": "^1.87.6",
            "@solana/spl-token": "^0.3.9",
            "@solana/wallet-adapter-react": "^0.15.35",
            "@metaplex-foundation/js": "^0.19.5"
          };
          devDependencies = {
            "@coral-xyz/anchor": "^0.29.0",
            "@solana/spl-token-metadata": "^0.1.2"
          };
          scripts = {
            "build:solana": "anchor build",
            "test:solana": "anchor test",
            "deploy:solana": "anchor deploy"
          };
          configFiles = [
            { path: 'Anchor.toml', template: 'solana/Anchor.toml' }
          ];
          break;
          
        case 'bnbchain':
          dependencies = {
            "@bnb-chain/greenfield-js-sdk": "^1.2.0",
            "@bnb-chain/dkg-client": "^0.2.4",
            "@bnb-chain/bsc-connector": "^3.0.0",
            "ethers": "^6.9.0",
            "web3": "^4.3.0",
            "@openzeppelin/contracts": "^5.0.0",
            "wagmi": "^1.4.12"
          };
          devDependencies = {
            "@bnb-chain/hardhat-deploy": "^0.1.1",
            "hardhat": "^2.19.4",
            "@nomicfoundation/hardhat-toolbox": "^4.0.0",
            "@bnb-chain/hardhat-verify": "^1.0.0"
          };
          scripts = {
            "compile:bnb": "hardhat compile",
            "test:bnb": "hardhat test",
            "deploy:bnb": "hardhat run scripts/deploy-bnb.js",
            "verify:bnb": "hardhat verify"
          };
          configFiles = [
            { path: 'hardhat.config.bnb.js', template: 'bnbchain/hardhat.config.js' },
            { path: 'scripts/deploy-bnb.js', template: 'bnbchain/deploy.js' }
          ];
          break;
          
        case 'base':
          dependencies = {
            "@base-org/sdk": "^0.1.0",
            "@base-org/node-sdk": "^0.1.0",
            "ethers": "^6.9.0",
            "web3": "^4.3.0",
            "@openzeppelin/contracts": "^5.0.0",
            "wagmi": "^1.4.12",
            "viem": "^1.21.4"
          };
          devDependencies = {
            "@base-org/hardhat-plugin": "^0.1.0",
            "hardhat": "^2.19.4",
            "@nomicfoundation/hardhat-toolbox": "^4.0.0",
            "@base-org/hardhat-verify": "^0.1.0",
            "foundry-rs": "^0.2.0"
          };
          scripts = {
            "compile:base": "hardhat compile",
            "test:base": "hardhat test",
            "deploy:base": "hardhat run scripts/deploy-base.js",
            "verify:base": "hardhat verify"
          };
          configFiles = [
            { path: 'hardhat.config.base.js', template: 'base/hardhat.config.js' },
            { path: 'scripts/deploy-base.js', template: 'base/deploy.js' },
            { path: 'foundry.toml', template: 'base/foundry.toml' }
          ];
          break;
      }
      
      // Update package.json
      await this.projectGenerator.updatePackageJson(
        projectDir,
        {
          dependencies,
          devDependencies,
          scripts
        }
      );
      
      // Create configuration files
      for (const configFile of configFiles) {
        try {
          // Get template content
          const templateContent = await this.projectGenerator.getTemplateContent(
            `blockchain/${configFile.template}`
          );
          
          // Create directory (if needed)
          const configFilePath = path.join(projectDir, configFile.path);
          const configFileDir = path.dirname(configFilePath);
          await this.projectGenerator.createDirectory(configFileDir);
          
          // Create configuration file
          await this.projectGenerator.createFile(configFilePath, templateContent);
        } catch (configError) {
          console.warn(`Failed to create configuration file ${configFile.path}:`, configError);
          // Continue processing other configuration files, without interrupting the process
        }
      }
      
      // Create blockchain-specific example code directory
      const examplesDir = path.join(projectDir, 'examples', blockchain);
      await this.projectGenerator.createDirectory(examplesDir);
      
      // Generate example code
      try {
        const exampleCode = await this.claudeService.generateContract(
          `Create a simple ${blockchain} example contract`,
          'dapp',
          { blockchain }
        );
        
        await this.projectGenerator.createFile(
          path.join(examplesDir, 'Example.sol'),
          exampleCode
        );
      } catch (exampleError) {
        console.warn(`Failed to generate ${blockchain} example code:`, exampleError);
        // Continue process, do not interrupt due to example generation failure
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to add ${blockchain} tools:`, error);
      return false;
    }
  }
}

module.exports = Web3ProjectManager;
