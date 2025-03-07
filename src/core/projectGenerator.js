/**
 * Project Generator
 * Core module for generating Web3 projects using AI and templates
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync, exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const ClaudeService = require('./claude');
const TemplateManager = require('./templateManager');

// Open source library configuration
const OPEN_SOURCE_REPOS = {
  // AI prompt engineering framework
  'langchain': {
    url: 'https://github.com/langchain-ai/langchain.git',
    // Note: langchain doesn't have a main branch, we'll auto-detect the default branch during cloning
    branch: null, // Auto-detect default branch
    installCmd: 'pip install -e .'
  },
  'gpt-engineer': {
    url: 'https://github.com/AntonOsika/gpt-engineer.git',
    branch: null, // Auto-detect default branch
    installCmd: 'pip install -e .'
  },
  
  // Web3 development framework
  'hardhat': {
    url: 'https://github.com/NomicFoundation/hardhat.git',
    branch: null, // Auto-detect default branch
    installCmd: 'npm install'
  },
  'anchor': {
    url: 'https://github.com/coral-xyz/anchor.git',
    branch: null, // Auto-detect default branch
    installCmd: 'cargo build'
  },
  
  // AI code generation framework
  'gpt4all': {
    url: 'https://github.com/nomic-ai/gpt4all.git',
    branch: null, // Auto-detect default branch
    installCmd: 'pip install -e .'
  },
  'claude-api': {
    url: 'https://github.com/anthropics/anthropic-sdk-python.git',
    branch: null, // Auto-detect default branch
    installCmd: 'pip install -e .'
  },
  
  // Local LLM deployment framework
  'llama.cpp': {
    url: 'https://github.com/ggerganov/llama.cpp.git',
    branch: null, // Auto-detect default branch
    installCmd: 'make'
  }
};

class ProjectGenerator {
  /**
   * Constructor for Project Generator
   * @param {Object} config - Configuration options
   * @param {ClaudeService} config.claudeService - Claude AI service instance
   * @param {TemplateManager} config.templateManager - Template manager instance
   * @param {string} config.templatesDir - Templates directory path
   * @param {string} config.outputDir - Output directory for generated projects
   * @param {string} config.defaultBlockchain - Default blockchain platform ('ethereum' or 'solana')
   * @param {string} config.integrationsDir - Directory for GitHub integrations
   */
  constructor(config = {}) {
    // Initialize Claude service with blockchain-specific configuration
    const claudeOptions = {
      defaultBlockchain: config.defaultBlockchain || 'ethereum',
      maxRetries: config.maxRetries || 3,
      useLangchain: config.useLangchain || false,
      useSolanaWeb3: config.useSolanaWeb3 || false
    };
    
    this.claudeService = config.claudeService || new ClaudeService(null, claudeOptions);
    this.templateManager = config.templateManager || 
      new TemplateManager(config.templatesDir);
    this.outputDir = config.outputDir || path.join(process.cwd(), 'output');
    this.defaultBlockchain = config.defaultBlockchain || 'ethereum';
    this.integrationsDir = config.integrationsDir || path.join(process.cwd(), 'integrations');
    this.gitHubRepos = OPEN_SOURCE_REPOS;
    
    // Framework integration configuration
    this.useLangchain = config.useLangchain || false;
    this.useSolanaWeb3 = config.useSolanaWeb3 || false;
  }

  /**
   * Initialize the project generator
   */
  async initialize() {
    try {
      // Initialize template manager
      await this.templateManager.initialize();
      
      // Ensure output directory exists
      try {
        await fs.access(this.outputDir);
      } catch (err) {
        await fs.mkdir(this.outputDir, { recursive: true });
      }
      
      // Ensure integrations directory exists
      try {
        await fs.access(this.integrationsDir);
      } catch (err) {
        await fs.mkdir(this.integrationsDir, { recursive: true });
      }
      
      return true;
    } catch (error) {
      console.error('Failed to initialize project generator:', error);
      return false;
    }
  }
  
  /**
   * Check if Git is installed
   * @returns {boolean} - Whether Git is available
   */
  async checkGitAvailable() {
    try {
      await exec('git --version');
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Get repository default branch
   * @param {string} repoUrl - Repository URL
   * @returns {Promise<string>} - Default branch name
   */
  async getDefaultBranch(repoUrl) {
    try {
      // Use git ls-remote command to get the branch that HEAD reference points to
      const { stdout } = await exec(`git ls-remote --symref ${repoUrl} HEAD`);
      const match = stdout.match(/ref: refs\/heads\/([^\s]+)\s+HEAD/);
      
      if (match) {
        return match[1]; // Return default branch name
      }
      
      // If unable to determine default branch, try some common default branch names
      console.warn(`Unable to determine default branch for repository ${repoUrl}, will try using 'main'`);
      return 'main';
    } catch (error) {
      console.warn(`Failed to get default branch: ${error.message}, will try using 'main'`);
      return 'main';
    }
  }
  
  /**
   * Clone GitHub repository to integration directory
   * @param {string} repoName - Repository name (defined in GITHUB_REPOS)
   * @returns {Promise<string>} - Cloned repository path
   */
  async cloneGitHubRepo(repoName) {
    try {
      if (!this.checkGitAvailable()) {
        throw new Error('Git not installed or unavailable');
      }
      
      if (!this.gitHubRepos[repoName]) {
        throw new Error(`No GitHub repository configuration found for '${repoName}'`);
      }
      
      const repo = this.gitHubRepos[repoName];
      const targetDir = path.join(this.integrationsDir, repo.directory);
      
      // Ensure target directory exists
      await fs.mkdir(path.dirname(targetDir), { recursive: true });
      
      // Check if directory already exists
      try {
        await fs.access(targetDir);
        console.log(`Repository directory already exists: ${targetDir}, skipping clone`);
        return targetDir;
      } catch (err) {
        // Directory does not exist, continue with clone
      }
      
      // If no branch specified, get default branch
      let branchToUse = repo.branch;
      if (!branchToUse) {
        try {
          branchToUse = await this.getDefaultBranch(repo.url);
          console.log(`Default branch detected for repository ${repoName}: ${branchToUse}`);
        } catch (error) {
          console.warn(`Unable to get default branch, will try direct clone: ${error.message}`);
        }
      }
      
      console.log(`Cloning ${repoName} to ${targetDir}...`);
      let gitCommand;
      
      if (branchToUse) {
        // If branch specified, use --branch parameter
        gitCommand = `git clone --depth 1 --branch ${branchToUse} ${repo.url} ${targetDir}`;
      } else {
        // If unable to determine branch, directly clone (Git will automatically use default branch)
        gitCommand = `git clone --depth 1 ${repo.url} ${targetDir}`;
      }
      
      try {
        const { stdout, stderr } = await execAsync(gitCommand);
        console.log(`Clone output: ${stdout}`);
        
        if (stderr && !stderr.includes('Cloning into')) {
          console.warn(`Clone warning: ${stderr}`);
        }
        
        return targetDir;
      } catch (cloneError) {
        // If using specified branch clone fails, try direct clone (without specifying branch)
        if (branchToUse) {
          console.warn(`Using branch ${branchToUse} clone failed: ${cloneError.message}`);
          console.log(`Trying without branch for clone...`);
          
          const fallbackCommand = `git clone --depth 1 ${repo.url} ${targetDir}`;
          const { stdout, stderr } = await execAsync(fallbackCommand);
          
          console.log(`Clone succeeded: ${stdout}`);
          if (stderr && !stderr.includes('Cloning into')) {
            console.warn(`Clone warning: ${stderr}`);
          }
          
          return targetDir;
        }
        
        throw cloneError;
      }
    } catch (error) {
      console.error(`Failed to clone GitHub repository ${repoName}:`, error);
      throw new Error(`Failed to clone GitHub repository: ${error.message}`);
    }
  }
  
  /**
   * Clone multiple GitHub repositories
   * @param {Array<string>} repoNames - List of repository names to clone
   * @returns {Promise<Object>} - Cloned repository paths mapping
   */
  async cloneMultipleRepos(repoNames) {
    const results = {};
    const errors = [];
    
    for (const repoName of repoNames) {
      try {
        results[repoName] = await this.cloneGitHubRepo(repoName);
      } catch (error) {
        console.error(`Failed to clone ${repoName}:`, error);
        errors.push({ repo: repoName, error: error.message });
      }
    }
    
    return { results, errors };
  }
  
  /**
   * Clone all configured GitHub repositories
   * @returns {Promise<Object>} - Clone results
   */
  async cloneAllRepos() {
    return await this.cloneMultipleRepos(Object.keys(this.gitHubRepos));
  }

  /**
   * Detect and configure framework integration in project
   * @param {string} projectDir - Project directory
   * @param {Array<string>} reposCloned - List of successfully cloned repositories
   * @returns {Promise<Object>} - Framework integration status
   */
  async detectFrameworkIntegration(projectDir, reposCloned) {
    // Detect which frameworks are successfully integrated
    const integrations = {
      langchain: this.useLangchain && reposCloned.includes('langchain'),
      solanaWeb3: this.useSolanaWeb3 && reposCloned.includes('solana-web3')
    };
    
    // Create integration configuration file
    const integrationsConfigPath = path.join(projectDir, 'integrations', 'framework-config.json');
    await fs.writeFile(
      integrationsConfigPath,
      JSON.stringify(integrations, null, 2)
    );
    
    console.log(`Framework integration status: ${JSON.stringify(integrations)}`);
    return integrations;
  }

  /**
   * Generate a Web3 project from description
   * @param {Object} projectSpec - Project specification
   * @param {string} projectSpec.name - Project name
   * @param {string} projectSpec.description - Project description
   * @param {string} projectSpec.type - Project type (token, nft, dapp)
   * @param {string} projectSpec.blockchain - Target blockchain (ethereum, solana)
   * @param {Object} projectSpec.params - Additional project parameters
   * @param {Array<string>} projectSpec.reposToClone - List of GitHub repositories to integrate
   * @returns {Promise<string>} - Path to generated project
   */
  async generateProject(projectSpec) {
    try {
      const { name, description, type, blockchain = this.defaultBlockchain, params = {}, reposToClone = [] } = projectSpec;
      
      // Sanitize project name for use as directory name
      const sanitizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const projectDir = path.join(this.outputDir, sanitizedName);
      
      console.log(`Starting to generate ${blockchain} blockchain ${type} project: ${name}`);
      
      // Create project directory
      await fs.mkdir(projectDir, { recursive: true });
      
      // Process framework integration - ensure required frameworks are added to clone list
      let frameworksToClone = [...reposToClone];
      
      if (this.useLangchain && !frameworksToClone.includes('langchain')) {
        frameworksToClone.push('langchain');
      }
      
      if (this.useSolanaWeb3 && blockchain === 'solana' && !frameworksToClone.includes('solana-web3')) {
        frameworksToClone.push('solana-web3');
      }
      
      // Add other potentially useful frameworks based on project type
      if (type === 'dapp' && blockchain === 'ethereum' && !frameworksToClone.includes('scaffold-eth-2')) {
        frameworksToClone.push('scaffold-eth-2');
      }
      
      // Clone required GitHub repositories
      let successfullyClonedRepos = [];
      if (frameworksToClone.length > 0) {
        console.log(`Cloning selected GitHub repositories for project: ${frameworksToClone.join(', ')}...`);
        const cloneResults = await this.cloneMultipleRepos(frameworksToClone);
        
        // Create integration directory
        const projectIntegrationsDir = path.join(projectDir, 'integrations');
        await fs.mkdir(projectIntegrationsDir, { recursive: true });
        
        // Create symbolic links for each successfully cloned repository
        for (const [repoName, repoPath] of Object.entries(cloneResults.results)) {
          successfullyClonedRepos.push(repoName);
          try {
            // On Windows, admin permissions are needed to create symbolic links, so here we use copy instead of link
            // Here we simply create a reference file
            await fs.writeFile(
              path.join(projectIntegrationsDir, `${repoName}.ref`),
              `Integration Path: ${repoPath}\n` +
              `To use this integration, please see the documentation in: ${this.integrationsDir}/${this.gitHubRepos[repoName].directory}`
            );
          } catch (error) {
            console.error(`Failed to create reference for repository ${repoName}:`, error);
          }
        }
        
        // Record any errors
        if (cloneResults.errors.length > 0) {
          await fs.writeFile(
            path.join(projectIntegrationsDir, 'clone-errors.log'),
            JSON.stringify(cloneResults.errors, null, 2)
          );
        }
        
        // Detect framework integration and create configuration
        await this.detectFrameworkIntegration(projectDir, successfullyClonedRepos);
      }
      
      // Update projectSpec to include blockchain and framework information
      const enhancedProjectSpec = {
        ...projectSpec,
        blockchain: blockchain,
        frameworks: {
          langchain: this.useLangchain && successfullyClonedRepos.includes('langchain'),
          solanaWeb3: this.useSolanaWeb3 && successfullyClonedRepos.includes('solana-web3')
        }
      };
      
      // Configure blockchain-specific dependencies and configuration files
      console.log(`Configuring specific dependencies and configuration files for ${blockchain} project...`);
      const dependenciesResult = await this.configureBlockchainSpecificDependencies(projectDir, blockchain, type);
      console.log(`Added ${Object.keys(dependenciesResult.dependencies).length} dependencies and ${Object.keys(dependenciesResult.devDependencies).length} development dependencies`);
      
      // Generate project structure based on blockchain and type
      const structure = await this.generateProjectStructure(description, type, blockchain);
      
      // Generate project files with enhanced spec
      await this.generateProjectFiles(projectDir, structure, enhancedProjectSpec);
      
      // Generate framework-specific files
      await this.generateFrameworkSpecificFiles(projectDir, blockchain, enhancedProjectSpec);
      
      // Generate README with framework information
      await this.generateReadme(projectDir, enhancedProjectSpec);
      
      console.log(`Project generated successfully at ${projectDir}`);
      return projectDir;
    } catch (error) {
      console.error('Failed to generate project:', error);
      throw new Error(`Project generation failed: ${error.message}`);
    }
  }

  /**
   * Configure blockchain-specific dependencies and configuration files
   * @param {string} projectDir - Project directory
   * @param {string} blockchain - Blockchain type (ethereum, solana)
   * @param {string} projectType - Project type (token, nft, dapp)
   * @returns {Promise<Object>} - Added dependencies
   */
  async configureBlockchainSpecificDependencies(projectDir, blockchain, projectType) {
    console.log(`Configuring ${blockchain} blockchain ${projectType} project specific dependencies...`);
    
    // Base dependencies
    const dependencies = {
      common: {
        "dotenv": "^16.0.3",
        "react": "^18.2.0",
        "react-dom": "^18.2.0"
      },
      ethereum: {
        "ethers": "^5.7.2",
        "web3": "^1.8.2",
        "@web3-react/core": "^6.1.9",
        "@web3-react/injected-connector": "^6.0.7"
      },
      solana: {
        "@solana/web3.js": "^1.73.3",
        "@solana/wallet-adapter-react": "^0.15.32",
        "@solana/wallet-adapter-wallets": "^0.19.16",
        "@solana/wallet-adapter-react-ui": "^0.9.31"
      }
    };
    
    // Project type-specific dependencies
    const typeDependencies = {
      token: {
        ethereum: {
          "@openzeppelin/contracts": "^4.8.2",
          "hardhat": "^2.13.0",
          "@nomiclabs/hardhat-ethers": "^2.2.2",
          "@nomiclabs/hardhat-waffle": "^2.0.5"
        },
        solana: {
          "@solana/spl-token": "^0.3.7",
          "@project-serum/anchor": "^0.26.0"
        }
      },
      nft: {
        ethereum: {
          "@openzeppelin/contracts": "^4.8.2",
          "hardhat": "^2.13.0",
          "@nomiclabs/hardhat-ethers": "^2.2.2",
          "@nomiclabs/hardhat-waffle": "^2.0.5",
          "ipfs-http-client": "^60.0.0"
        },
        solana: {
          "@metaplex-foundation/js": "^0.18.3",
          "@metaplex-foundation/mpl-token-metadata": "^2.11.1",
          "@project-serum/anchor": "^0.26.0"
        }
      },
      dapp: {
        ethereum: {
          "@openzeppelin/contracts": "^4.8.2",
          "hardhat": "^2.13.0",
          "@nomiclabs/hardhat-ethers": "^2.2.2",
          "@nomiclabs/hardhat-waffle": "^2.0.5",
          "chai": "^4.3.7",
          "ethereum-waffle": "^4.0.10"
        },
        solana: {
          "@project-serum/anchor": "^0.26.0",
          "@solana/buffer-layout": "^4.0.1",
          "borsh": "^0.7.0"
        }
      }
    };
    
    // Development dependencies
    const devDependencies = {
      common: {
        "eslint": "^8.36.0",
        "prettier": "^2.8.4"
      },
      ethereum: {
        "@nomicfoundation/hardhat-toolbox": "^2.0.2",
        "hardhat-deploy": "^0.11.25"
      },
      solana: {
        "@types/bn.js": "^5.1.1",
        "@solana/spl-token": "^0.3.7"
      }
    };
    
    // Merge dependencies
    const mergedDependencies = {
      ...dependencies.common,
      ...dependencies[blockchain],
      ...(typeDependencies[projectType] && typeDependencies[projectType][blockchain] ? typeDependencies[projectType][blockchain] : {})
    };
    
    const mergedDevDependencies = {
      ...devDependencies.common,
      ...(devDependencies[blockchain] ? devDependencies[blockchain] : {})
    };
    
    // Create or update package.json
    const packageJsonPath = path.join(projectDir, 'package.json');
    let packageJson = {};
    
    try {
      // Try to read existing package.json
      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
      packageJson = JSON.parse(packageJsonContent);
    } catch (error) {
      // If file does not exist, create a new package.json
      packageJson = {
        "name": path.basename(projectDir),
        "version": "0.1.0",
        "private": true,
        "scripts": {
          "dev": "next dev",
          "build": "next build",
          "start": "next start"
        }
      };
    }
    
    // Add or update dependencies
    packageJson.dependencies = {
      ...(packageJson.dependencies || {}),
      ...mergedDependencies
    };
    
    packageJson.devDependencies = {
      ...(packageJson.devDependencies || {}),
      ...mergedDevDependencies
    };
    
    // Write updated package.json
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    
    // Create blockchain-specific configuration files
    if (blockchain === 'ethereum') {
      // Create hardhat.config.js
      const hardhatConfigPath = path.join(projectDir, 'hardhat.config.js');
      const hardhatConfig = `require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require('dotenv').config();

module.exports = {
  solidity: "0.8.17",
  networks: {
    hardhat: {},
    goerli: {
      url: process.env.GOERLI_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    },
    mainnet: {
      url: process.env.MAINNET_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    artifacts: "./artifacts"
  }
};
`;
      await fs.writeFile(hardhatConfigPath, hardhatConfig);
      
      // Create .env.example file
      const envExamplePath = path.join(projectDir, '.env.example');
      const envExample = `PRIVATE_KEY=your_private_key_here
GOERLI_RPC_URL=your_goerli_rpc_url_here
SEPOLIA_RPC_URL=your_sepolia_rpc_url_here
MAINNET_RPC_URL=your_mainnet_rpc_url_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here
`;
      await fs.writeFile(envExamplePath, envExample);
    } else if (blockchain === 'solana') {
      // Create solana configuration file
      const solanaConfigPath = path.join(projectDir, 'solana-program.config.js');
      const solanaConfig = `require('dotenv').config();

module.exports = {
  programId: process.env.PROGRAM_ID || '',
  networks: {
    mainnet: {
      url: process.env.SOLANA_MAINNET_RPC_URL || 'https://api.mainnet-beta.solana.com',
    },
    devnet: {
      url: process.env.SOLANA_DEVNET_RPC_URL || 'https://api.devnet.solana.com',
    },
    testnet: {
      url: process.env.SOLANA_TESTNET_RPC_URL || 'https://api.testnet.solana.com',
    },
    localnet: {
      url: 'http://localhost:8899',
    },
  },
  defaultNetwork: 'devnet',
};
`;
      await fs.writeFile(solanaConfigPath, solanaConfig);
      
      // Create .env.example file
      const envExamplePath = path.join(projectDir, '.env.example');
      const envExample = `SOLANA_PRIVATE_KEY=[1,2,3,...] # Your Solana wallet private key (array format)
SOLANA_MAINNET_RPC_URL=your_mainnet_rpc_url_here
SOLANA_DEVNET_RPC_URL=your_devnet_rpc_url_here
SOLANA_TESTNET_RPC_URL=your_testnet_rpc_url_here
PROGRAM_ID=your_program_id_here
`;
      await fs.writeFile(envExamplePath, envExample);
    }
    
    return { dependencies: mergedDependencies, devDependencies: mergedDevDependencies };
  }

  /**
   * Generate framework-specific files
   * @param {string} projectDir - Project directory
   * @param {string} blockchain - Blockchain type (ethereum, solana)
   * @param {Object} projectSpec - Project specification
   * @returns {Promise<void>}
   */
  async generateFrameworkSpecificFiles(projectDir, blockchain, projectSpec) {
    try {
      const { frameworks = {} } = projectSpec;
      const srcDir = path.join(projectDir, 'src');
      const utilsDir = path.join(srcDir, 'utils');
      
      // Ensure directory exists
      await fs.mkdir(utilsDir, { recursive: true });
      
      // Generate specific files based on blockchain type
      if (blockchain === 'ethereum') {
        // Ethereum-specific files
        await fs.writeFile(
          path.join(utilsDir, 'ethereum.js'),
          '/**\n * Ethereum blockchain utilities\n */\n\n// Ethereum network configuration\nconst ETHEREUM_NETWORKS = {\n  mainnet: {\n    name: "Ethereum Mainnet",\n    chainId: 1,\n    rpcUrl: "https://mainnet.infura.io/v3/YOUR_INFURA_KEY"\n  },\n  goerli: {\n    name: "Goerli Testnet",\n    chainId: 5,\n    rpcUrl: "https://goerli.infura.io/v3/YOUR_INFURA_KEY"\n  },\n  sepolia: {\n    name: "Sepolia Testnet",\n    chainId: 11155111,\n    rpcUrl: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY"\n  }\n};\n\n// Web3 provider configuration\nconst getWeb3Provider = () => {\n  // Implement provider selection logic based on environment and configuration\n  return window.ethereum || null;\n};\n\nmodule.exports = {\n  ETHEREUM_NETWORKS,\n  getWeb3Provider\n};\n'
        );
      } else if (blockchain === 'solana') {
        // Solana-specific files
        await fs.writeFile(
          path.join(utilsDir, 'solana.js'),
          '/**\n * Solana blockchain utilities\n */\n\n// Solana network configuration\nconst SOLANA_NETWORKS = {\n  mainnet: {\n    name: "Solana Mainnet",\n    endpoint: "https://api.mainnet-beta.solana.com"\n  },\n  devnet: {\n    name: "Devnet",\n    endpoint: "https://api.devnet.solana.com"\n  },\n  testnet: {\n    name: "Testnet",\n    endpoint: "https://api.testnet.solana.com"\n  }\n};\n\n// Get Solana connection\nconst getSolanaConnection = (network = "devnet") => {\n  // In actual use, @solana/web3.js will be imported and Connection instance will be created\n  return SOLANA_NETWORKS[network] || SOLANA_NETWORKS.devnet;\n};\n\nmodule.exports = {\n  SOLANA_NETWORKS,\n  getSolanaConnection\n};\n'
        );
      }
      
      // Generate specific files based on integrated frameworks
      if (frameworks.langchain) {
        console.log('Integrating LangChain framework...');
        const aiDir = path.join(srcDir, 'ai');
        await fs.mkdir(aiDir, { recursive: true });
        
        await fs.writeFile(
          path.join(aiDir, 'langchain-integration.js'),
          '/**\n * LangChain integration module\n */\n\n// Note: In actual use, langchain needs to be installed via npm\n// npm install langchain\n\n// LangChain configuration\nconst LANGCHAIN_CONFIG = {\n  enabled: true,\n  modelName: "gpt-3.5-turbo", // Default model\n  temperature: 0.7,\n  referenceIntegration: "../integrations/langchain.ref"\n};\n\n// Initialize LangChain functionality\nconst initLangChain = async () => {\n  try {\n    console.log("Initializing LangChain integration...");\n    // This will be the actual code to initialize LangChain\n    return { success: true, message: "LangChain initialized successfully" };\n  } catch (error) {\n    console.error("Failed to initialize LangChain:", error);\n    return { success: false, error: error.message };\n  }\n};\n\nmodule.exports = {\n  LANGCHAIN_CONFIG,\n  initLangChain\n};\n'
        );
      }
      
      if (frameworks.solanaWeb3 && blockchain === 'solana') {
        console.log('Integrating Solana Web3.js framework...');
        const solanaDir = path.join(srcDir, 'solana');
        await fs.mkdir(solanaDir, { recursive: true });
        
        await fs.writeFile(
          path.join(solanaDir, 'web3-integration.js'),
          '/**\n * Solana Web3.js integration module\n */\n\n// Note: In actual use, @solana/web3.js needs to be installed via npm\n// npm install @solana/web3.js\n\n// Solana Web3 configuration\nconst SOLANA_WEB3_CONFIG = {\n  enabled: true,\n  network: "devnet", // Default network\n  referenceIntegration: "../integrations/solana-web3.ref"\n};\n\n// Initialize Solana Web3 functionality\nconst initSolanaWeb3 = async () => {\n  try {\n    console.log("Initializing Solana Web3 integration...");\n    // This will be the actual code to initialize Solana Web3\n    return { success: true, message: "Solana Web3 initialized successfully" };\n  } catch (error) {\n    console.error("Failed to initialize Solana Web3:", error);\n    return { success: false, error: error.message };\n  }\n};\n\n// Create Solana wallet connection functionality\nconst connectWallet = async () => {\n  try {\n    console.log("Connecting Solana wallet...");\n    // Actual wallet connection code will be here\n    return { success: true, message: "Wallet connected successfully" };\n  } catch (error) {\n    console.error("Failed to connect wallet:", error);\n    return { success: false, error: error.message };\n  }\n};\n\nmodule.exports = {\n  SOLANA_WEB3_CONFIG,\n  initSolanaWeb3,\n  connectWallet\n};\n'
        );
      }

      // Generate dependency management file (for framework integration)
      let dependencies = {
        "dotenv": "^16.0.3"
      };
      
      if (blockchain === 'ethereum') {
        dependencies = {
          ...dependencies,
          "ethers": "^5.7.2",
          "web3": "^1.8.2"
        };
      } else if (blockchain === 'solana') {
        dependencies = {
          ...dependencies,
          "@solana/web3.js": "^1.73.3"
        };
      }
      
      if (frameworks.langchain) {
        dependencies = {
          ...dependencies,
          "langchain": "^0.0.75"
        };
      }
      
      // Update or create package.json
      try {
        const packageJsonPath = path.join(projectDir, 'package.json');
        let packageJson;
        
        try {
          const existingPackageJson = await fs.readFile(packageJsonPath, 'utf8');
          packageJson = JSON.parse(existingPackageJson);
        } catch (error) {
          // If file does not exist, create a new package.json
          packageJson = {
            "name": projectSpec.name.toLowerCase().replace(/\s+/g, '-'),
            "version": "0.1.0",
            "description": projectSpec.description,
            "main": "index.js",
            "scripts": {
              "start": "node index.js",
              "test": "echo \"Error: no test specified\" && exit 1"
            },
            "keywords": [
              "web3",
              blockchain,
              projectSpec.type
            ],
            "author": "",
            "license": "MIT"
          };
        }
        
        // Update dependencies
        packageJson.dependencies = {
          ...(packageJson.dependencies || {}),
          ...dependencies
        };
        
        await fs.writeFile(
          packageJsonPath,
          JSON.stringify(packageJson, null, 2)
        );
        
      } catch (error) {
        console.error('Failed to update package.json:', error);
      }
      
      console.log(`Framework-specific files generated, supporting ${blockchain} blockchain${frameworks.langchain ? ' and LangChain' : ''}${frameworks.solanaWeb3 ? ' and Solana Web3.js' : ''}`);
    } catch (error) {
      console.error('Failed to generate framework-specific files:', error);
    }
  }
  
  /**
   * Generate project structure
   * @param {string} description - Project description
   * @param {string} type - Project type
   * @param {string} blockchain - Target blockchain
   * @returns {Promise<Object>} - Project structure
   */
  async generateProjectStructure(description, type, blockchain = this.defaultBlockchain) {
    try {
      console.log(`Generating structure for ${type} project on ${blockchain} blockchain...`);
      
      // Try to find matching template, prioritize blockchain-specific templates
      const projectTemplates = await this.templateManager.getTemplates('projects');
      let templateMatch = null;
      
      // Check blockchain-specific templates
      const blockchainSpecificTemplates = {
        token: {
          ethereum: 'ethereum-token-project.json',
          solana: 'solana-token-project.json'
        },
        nft: {
          ethereum: 'ethereum-nft-project.json',
          solana: 'solana-nft-project.json'
        },
        dapp: {
          ethereum: 'ethereum-dapp-project.json',
          solana: 'solana-dapp-project.json'
        }
      };
      
      // Try to load blockchain-specific template
      if (blockchainSpecificTemplates[type] && 
          blockchainSpecificTemplates[type][blockchain] && 
          projectTemplates.includes(blockchainSpecificTemplates[type][blockchain])) {
        console.log(`Using ${blockchain}-specific ${type} project template`);
        const templateContent = await this.templateManager.getTemplateContent(
          'projects', 
          blockchainSpecificTemplates[type][blockchain]
        );
        templateMatch = JSON.parse(templateContent);
      }
      // If no blockchain-specific template, try project type template
      else if (type === 'token' && projectTemplates.includes('token-project.json')) {
        console.log(`Using generic token project template`);
        const templateContent = await this.templateManager.getTemplateContent('projects', 'token-project.json');
        templateMatch = JSON.parse(templateContent);
      } else if (type === 'nft' && projectTemplates.includes('nft-project.json')) {
        console.log(`Using generic NFT project template`);
        const templateContent = await this.templateManager.getTemplateContent('projects', 'nft-project.json');
        templateMatch = JSON.parse(templateContent);
      } else if (projectTemplates.includes('basic-web3-project.json')) {
        // Fallback to basic project template
        console.log(`Using generic Web3 project template`);
        const templateContent = await this.templateManager.getTemplateContent('projects', 'basic-web3-project.json');
        templateMatch = JSON.parse(templateContent);
      }
      
      if (templateMatch) {
        return templateMatch.structure;
      }
      
      // If no matching template, use AI to generate project structure
      console.log(`No matching template found, using AI to generate project structure...`);
      const prompt = `
        Project Type: ${type}
        Blockchain: ${blockchain}
        Description: ${description}
        
        Please generate a suitable ${blockchain === 'ethereum' ? 'Ethereum' : 'Solana'} blockchain ${type} project structure.
      `;
      
      const structure = await this.claudeService.generateProjectStructure(prompt);
      
      return structure;
    } catch (error) {
      console.error('Failed to generate project structure:', error);
      // Fallback to basic structure
      return {
        "contracts": {},
        "frontend": {
          "src": {
            "components": {},
            "pages": {},
            "styles": {}
          },
          "public": {}
        },
        "scripts": {},
        "README.md": ""
      };
    }
  }

  /**
   * Generate project files from structure
   * @param {string} projectDir - Project directory path
   * @param {Object} structure - Project structure
   * @param {Object} projectSpec - Project specification
   */
  async generateProjectFiles(projectDir, structure, projectSpec) {
    const { name, description, type, blockchain = this.defaultBlockchain, params } = projectSpec;
    
    // Process the structure and create files and directories
    await this.processStructure(projectDir, structure, {
      ProjectName: name,
      ProjectDescription: description,
      TokenName: params.tokenName || name,
      TokenSymbol: params.tokenSymbol || name.substring(0, 3).toUpperCase(),
      Network: params.network || 'devnet',
      Blockchain: blockchain || this.defaultBlockchain
    });
    
    // Generate smart contract based on project type and blockchain
    // Default file extensions based on blockchain
    const fileExtension = blockchain === 'solana' ? '.rs' : '.sol';
    
    // Determine contract type based on project type and blockchain
    let contractType;
    let contractFileName;
    
    if (type === 'token') {
      if (blockchain === 'ethereum') {
        contractType = 'ERC20';
        contractFileName = 'Token.sol';
      } else if (blockchain === 'solana') {
        contractType = 'SPL-Token';
        contractFileName = 'token.rs';
      } else {
        // Fallback
        contractType = 'ERC20';
        contractFileName = 'Token.sol';
      }
    } else if (type === 'nft') {
      if (blockchain === 'ethereum') {
        contractType = 'ERC721';
        contractFileName = 'NFT.sol';
      } else if (blockchain === 'solana') {
        contractType = 'Metaplex-NFT';
        contractFileName = 'nft.rs';
      } else {
        // Fallback
        contractType = 'ERC721';
        contractFileName = 'NFT.sol';
      }
    }
    
    if (contractType) {
      const contractContent = await this.generateContract(description, contractType, blockchain, params);
      await fs.writeFile(
        path.join(projectDir, 'contracts', contractFileName),
        contractContent
      );
    }
    
    // Generate frontend components
    const walletConnectorContent = await this.generateComponent('WalletConnector', 
      blockchain, 
      {
        Network: params.network || 'devnet',
        Blockchain: blockchain || this.defaultBlockchain
      }
    );
    
    await fs.writeFile(
      path.join(projectDir, 'frontend', 'src', 'components', 'WalletConnector.jsx'),
      walletConnectorContent
    );
  }

  /**
   * Process project structure recursively to create files and directories
   * @param {string} basePath - Current base path
   * @param {Object} structure - Structure object or value
   * @param {Object} variables - Template variables
   */
  async processStructure(basePath, structure, variables) {
    for (const key in structure) {
      const currentPath = path.join(basePath, key);
      const value = structure[key];
      
      if (value === null) {
        // Empty file
        await fs.writeFile(currentPath, '');
      } else if (typeof value === 'string') {
        // File with content
        let content = value;
        
        // Replace template variables
        for (const varName in variables) {
          const regex = new RegExp(`\\{\\{${varName}\\}\\}`, 'g');
          content = content.replace(regex, variables[varName]);
        }
        
        // If content starts with '{{' and ends with '}}', it might be a template reference
        if (content.startsWith('{{') && content.endsWith('}}')) {
          const templateName = content.substring(2, content.length - 2);
          try {
            // Try to resolve template from our template system
            const [category, name] = templateName.split('.');
            if (category && name && this.templateManager.categories[category]) {
              const templateContent = await this.templateManager.getTemplateContent(category, name);
              content = templateContent;
            }
          } catch (error) {
            // If template resolution fails, keep original content
            console.warn(`Failed to resolve template: ${content}`);
          }
        }
        
        await fs.writeFile(currentPath, content);
      } else if (typeof value === 'object') {
        // Directory with subdirectories/files
        await fs.mkdir(currentPath, { recursive: true });
        await this.processStructure(currentPath, value, variables);
      }
    }
  }

  /**
   * Generate smart contract using template or AI
   * @param {string} description - Project description
   * @param {string} contractType - Contract type (ERC20, ERC721, SPL-Token, etc.)
   * @param {string} blockchain - Target blockchain (ethereum, solana)
   * @param {Object} params - Contract parameters
   * @returns {Promise<string>} - Contract content
   */
  async generateContract(description, contractType, blockchain, params = {}) {
    // Default to ethereum if blockchain is not specified
    blockchain = blockchain || this.defaultBlockchain;
    try {
      // Try to get template
      const contractTemplates = await this.templateManager.getTemplates('contracts');
      
      if (contractTemplates.includes(`${contractType}.sol`)) {
        let template = await this.templateManager.getTemplateContent('contracts', `${contractType}.sol`);
        
        // Replace template variables
        const variables = {
          TokenName: params.tokenName || 'MyToken',
          TokenSymbol: params.tokenSymbol || 'MTK',
          InitialSupply: params.initialSupply || '1000000',
          CollectionName: params.collectionName || 'MyNFT',
          MaxSupply: params.maxSupply || '10000',
          MintPrice: params.mintPrice || '10000000000000000', // 0.01 ETH in Wei
          BaseURI: params.baseURI || 'https://example.com/metadata/'
        };
        
        for (const varName in variables) {
          const regex = new RegExp(`\\{\\{${varName}\\}\\}`, 'g');
          template = template.replace(regex, variables[varName]);
        }
        
        return template;
      }
      
      // Fallback to AI generation with blockchain-specific options
      return await this.claudeService.generateContract(description, contractType, {
        blockchain: blockchain,
        additionalRequirements: params.additionalRequirements || ''
      });
    } catch (error) {
      console.error(`Failed to generate ${contractType} contract:`, error);
      return `// SPDX-License-Identifier: MIT\npragma solidity ^0.8.17;\n\n// Failed to generate contract: ${error.message}\n// Please replace with your contract code`;
    }
  }

  /**
   * Generate React component
   * @param {string} componentName - Component name
   * @param {string} blockchain - Target blockchain (ethereum, solana)
   * @param {Object} params - Component parameters
   * @returns {Promise<string>} - Component content
   */
  async generateComponent(componentName, blockchain, params = {}) {
    // Default to ethereum if blockchain is not specified
    blockchain = blockchain || this.defaultBlockchain;
    try {
      // Try to get template
      const componentTemplates = await this.templateManager.getTemplates('frontend');
      
      if (componentTemplates.includes(`${componentName}.jsx`)) {
        let template = await this.templateManager.getTemplateContent('frontend', `${componentName}.jsx`);
        
        // Replace template variables
        for (const varName in params) {
          const regex = new RegExp(`\\{\\{${varName}\\}\\}`, 'g');
          template = template.replace(regex, params[varName]);
        }
        
        return template;
      }
      
      // Fallback to AI generation with blockchain-specific options
      return await this.claudeService.generateFrontend(
        `Component: ${componentName}`,
        'React',
        {
          blockchain: blockchain,
          componentName: componentName,
          additionalRequirements: params.additionalRequirements || ''
        }
      );
    } catch (error) {
      console.error(`Failed to generate ${componentName} component:`, error);
      return `// Failed to generate component: ${error.message}\nimport React from 'react';\n\nconst ${componentName} = () => {\n  return <div>Component content</div>;\n};\n\nexport default ${componentName};`;
    }
  }

  /**
   * Generate project README
   * @param {string} projectDir - Project directory
   * @param {Object} projectSpec - Project specification
   */
  async generateReadme(projectDir, projectSpec) {
    const { name, description, type, blockchain = this.defaultBlockchain } = projectSpec;
    
    const readme = `# ${name}

## Project Description
${description}

## Project Type
${type.charAt(0).toUpperCase() + type.slice(1)} Web3 Project

## Blockchain
${blockchain.charAt(0).toUpperCase() + blockchain.slice(1)}

## Getting Started

### Prerequisites
- Node.js v16+
- npm or yarn

### Installation
\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev
\`\`\`

### Smart Contracts
The smart contracts are located in the \`contracts\` directory.

### Frontend
The frontend application is located in the \`frontend\` directory.

## Deployment
See the \`scripts\` directory for deployment scripts.

## License
MIT
`;
    
    await fs.writeFile(path.join(projectDir, 'README.md'), readme);
  }
}

module.exports = ProjectGenerator;
