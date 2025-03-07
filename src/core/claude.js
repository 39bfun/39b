/**
 * Claude API integration module
 * This module handles all interactions with the Claude AI API
 * Enhanced with multi-chain support and improved error handling
 * Integrated with external frameworks like langchain and solana-web3
 */

const { Anthropic } = require('@anthropic-ai/sdk');
const path = require('path');
const fs = require('fs').promises;
const claudeExtensions = require('./claudeApiExtensions');

// Framework integration paths
const FRAMEWORKS_PATH = {
  LANGCHAIN: '../../../test-integrations/integrations/langchain',
  SOLANA_WEB3: '../../../test-integrations/integrations/solana-web3'
};

// Try to detect if a framework is available
const isFrameworkAvailable = async (frameworkPath) => {
  try {
    await fs.access(path.resolve(__dirname, frameworkPath));
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * ClaudeService - Main service for interacting with Claude AI
 */
class ClaudeService {
  /**
   * Initialize Claude service with API key and options
   * @param {string} apiKey - Claude API key (optional, defaults to env variable)
   * @param {Object} options - Additional configuration options
   */
  constructor(apiKey, options = {}) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.CLAUDE_API_KEY,
    });
    
    // Default configuration
    this.config = {
      model: options.model || "claude-3-sonnet-20240229",
      maxTokens: options.maxTokens || 4000,
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000, // 1 second
      defaultBlockchain: options.defaultBlockchain || "ethereum", // ethereum or solana
      temperature: options.temperature || 0.7,
      useLangchain: options.useLangchain !== undefined ? options.useLangchain : true,
      useSolanaWeb3: options.useSolanaWeb3 !== undefined ? options.useSolanaWeb3 : true
    };
    
    // Initialize external framework integration status
    this.frameworks = {
      langchain: {
        available: false,
        path: FRAMEWORKS_PATH.LANGCHAIN
      },
      solanaWeb3: {
        available: false,
        path: FRAMEWORKS_PATH.SOLANA_WEB3
      }
    };
    
    // Asynchronously detect framework availability (executed after initialization)
    this.detectFrameworks();
    
    // Blockchain networks configuration
    this.blockchainNetworks = {
      ethereum: {
        mainnet: {
          chainId: 1,
          name: "Ethereum Mainnet",
          rpcUrl: "https://mainnet.infura.io/v3/${INFURA_API_KEY}",
          explorerUrl: "https://etherscan.io"
        },
        sepolia: {
          chainId: 11155111,
          name: "Sepolia Testnet",
          rpcUrl: "https://sepolia.infura.io/v3/${INFURA_API_KEY}",
          explorerUrl: "https://sepolia.etherscan.io"
        },
        goerli: {
          chainId: 5,
          name: "Goerli Testnet",
          rpcUrl: "https://goerli.infura.io/v3/${INFURA_API_KEY}",
          explorerUrl: "https://goerli.etherscan.io"
        }
      },
      solana: {
        mainnet: {
          name: "Solana Mainnet",
          url: "https://api.mainnet-beta.solana.com",
          explorerUrl: "https://explorer.solana.com"
        },
        devnet: {
          name: "Solana Devnet",
          url: "https://api.devnet.solana.com",
          explorerUrl: "https://explorer.solana.com/?cluster=devnet"
        },
        testnet: {
          name: "Solana Testnet",
          url: "https://api.testnet.solana.com",
          explorerUrl: "https://explorer.solana.com/?cluster=testnet"
        }
      },
      bnbchain: {
        mainnet: {
          chainId: 56,
          name: "BNB Chain Mainnet",
          rpcUrl: "https://bsc-dataseed.binance.org",
          explorerUrl: "https://bscscan.com"
        },
        testnet: {
          chainId: 97,
          name: "BNB Chain Testnet",
          rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545",
          explorerUrl: "https://testnet.bscscan.com"
        }
      },
      base: {
        mainnet: {
          chainId: 8453,
          name: "Base Mainnet",
          rpcUrl: "https://mainnet.base.org",
          explorerUrl: "https://basescan.org"
        },
        goerli: {
          chainId: 84531,
          name: "Base Goerli Testnet",
          rpcUrl: "https://goerli.base.org",
          explorerUrl: "https://goerli.basescan.org"
        },
        sepolia: {
          chainId: 84532,
          name: "Base Sepolia Testnet",
          rpcUrl: "https://sepolia.base.org",
          explorerUrl: "https://sepolia.basescan.org"
        }
      },
      polygon: {
        mainnet: {
          chainId: 137,
          name: "Polygon Mainnet",
          rpcUrl: "https://polygon-rpc.com",
          explorerUrl: "https://polygonscan.com"
        },
        mumbai: {
          chainId: 80001,
          name: "Polygon Mumbai Testnet",
          rpcUrl: "https://rpc-mumbai.maticvigil.com",
          explorerUrl: "https://mumbai.polygonscan.com"
        },
        amoy: {
          chainId: 80002,
          name: "Polygon Amoy Testnet",
          rpcUrl: "https://rpc-amoy.polygon.technology",
          explorerUrl: "https://amoy.polygonscan.com"
        }
      },
      avalanche: {
        mainnet: {
          chainId: 43114,
          name: "Avalanche C-Chain",
          rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
          explorerUrl: "https://snowtrace.io"
        },
        fuji: {
          chainId: 43113,
          name: "Avalanche Fuji Testnet",
          rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
          explorerUrl: "https://testnet.snowtrace.io"
        }
      },
      arbitrum: {
        mainnet: {
          chainId: 42161,
          name: "Arbitrum One",
          rpcUrl: "https://arb1.arbitrum.io/rpc",
          explorerUrl: "https://arbiscan.io"
        },
        sepolia: {
          chainId: 421614,
          name: "Arbitrum Sepolia",
          rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
          explorerUrl: "https://sepolia.arbiscan.io"
        },
        nova: {
          chainId: 42170,
          name: "Arbitrum Nova",
          rpcUrl: "https://nova.arbitrum.io/rpc",
          explorerUrl: "https://nova.arbiscan.io"
        }
      }
    };
    
    // Blockchain-specific contract types
    this.contractTypes = {
      ethereum: {
        token: {
          name: "ERC20 Token",
          description: "Standard ERC20 fungible token",
          standards: ["ERC20"],
          interfaces: ["IERC20"],
          libraries: ["@openzeppelin/contracts"],
          frontendLibraries: ["ethers.js", "web3.js", "wagmi", "useDapp", "react-moralis"],
        },
        nft: {
          name: "ERC721 NFT Collection",
          description: "Standard ERC721 non-fungible token collection",
          standards: ["ERC721"],
          interfaces: ["IERC721", "IERC721Metadata", "IERC721Enumerable"],
          libraries: ["@openzeppelin/contracts"],
          frontendLibraries: ["ethers.js", "web3.js", "wagmi", "thirdweb", "NFT.Storage"],
        },
        dapp: {
          name: "Ethereum dApp",
          description: "Decentralized application on Ethereum",
          frameworks: ["Hardhat", "Truffle"],
          frontendLibraries: ["ethers.js", "web3.js", "wagmi", "viem", "useDapp"],
        }
      },
      solana: {
        token: {
          name: "SPL Token",
          description: "Solana Program Library token",
          standards: ["SPL"],
          programs: ["Token Program"],
          frameworks: ["Anchor"],
          frontendLibraries: ["@solana/web3.js", "@solana/wallet-adapter", "@solana/spl-token"],
        },
        nft: {
          name: "Metaplex NFT",
          description: "Metaplex NFT standard on Solana",
          standards: ["Metaplex"],
          programs: ["Token Metadata Program"],
          frameworks: ["Metaplex", "Anchor"],
          frontendLibraries: ["@solana/web3.js", "@solana/wallet-adapter", "@metaplex-foundation/js", "@metaplex-foundation/umi"],
        },
        dapp: {
          name: "Solana dApp",
          description: "Decentralized application on Solana",
          frameworks: ["Anchor"],
          frontendLibraries: ["@solana/web3.js", "@solana/wallet-adapter", "@coral-xyz/anchor"],
        }
      },
      bnbchain: {
        token: {
          name: "BEP20 Token",
          description: "BNB Chain token standard (compatible with ERC20)",
          standards: ["BEP20"],
          interfaces: ["IBEP20"],
          libraries: ["@openzeppelin/contracts"],
          frontendLibraries: ["ethers.js", "web3.js", "wagmi"],
        },
        nft: {
          name: "BEP721 NFT Collection",
          description: "BNB Chain NFT standard (compatible with ERC721)",
          standards: ["BEP721"],
          interfaces: ["IBEP721", "IBEP721Metadata"],
          libraries: ["@openzeppelin/contracts"],
          frontendLibraries: ["ethers.js", "web3.js", "thirdweb"],
        },
        dapp: {
          name: "BNB Chain dApp",
          description: "Decentralized application on BNB Chain",
          frameworks: ["Hardhat", "Truffle"],
          frontendLibraries: ["ethers.js", "web3.js", "wagmi"],
        }
      },
      base: {
        token: {
          name: "Base ERC20 Token",
          description: "ERC20 token on Base (Coinbase L2)",
          standards: ["ERC20"],
          interfaces: ["IERC20"],
          libraries: ["@openzeppelin/contracts"],
          frontendLibraries: ["ethers.js", "web3.js", "wagmi", "viem"],
        },
        nft: {
          name: "Base NFT Collection",
          description: "NFT collection on Base (Coinbase L2)",
          standards: ["ERC721"],
          interfaces: ["IERC721", "IERC721Metadata"],
          libraries: ["@openzeppelin/contracts"],
          frontendLibraries: ["ethers.js", "web3.js", "wagmi", "viem"],
        },
        dapp: {
          name: "Base dApp",
          description: "Decentralized application on Base (Coinbase L2)",
          frameworks: ["Hardhat", "Foundry"],
          frontendLibraries: ["ethers.js", "web3.js", "wagmi", "viem"],
        }
      },
      polygon: {
        token: {
          name: "Polygon ERC20 Token",
          description: "ERC20 token on Polygon network",
          standards: ["ERC20"],
          interfaces: ["IERC20"],
          libraries: ["@openzeppelin/contracts"],
          frontendLibraries: ["ethers.js", "web3.js", "wagmi", "@maticnetwork/maticjs"],
        },
        nft: {
          name: "Polygon NFT Collection",
          description: "NFT collection on Polygon network",
          standards: ["ERC721"],
          interfaces: ["IERC721", "IERC721Metadata"],
          libraries: ["@openzeppelin/contracts"],
          frontendLibraries: ["ethers.js", "web3.js", "wagmi", "@maticnetwork/maticjs", "NFT.Storage"],
        },
        dapp: {
          name: "Polygon dApp",
          description: "Decentralized application on Polygon network",
          frameworks: ["Hardhat", "Truffle"],
          frontendLibraries: ["ethers.js", "web3.js", "wagmi", "@maticnetwork/maticjs"],
        }
      },
      avalanche: {
        token: {
          name: "Avalanche Token",
          description: "Token on Avalanche C-Chain",
          standards: ["ERC20"],
          interfaces: ["IERC20"],
          libraries: ["@openzeppelin/contracts"],
          frontendLibraries: ["ethers.js", "web3.js", "@avalabs/avalanchejs"],
        },
        nft: {
          name: "Avalanche NFT Collection",
          description: "NFT collection on Avalanche C-Chain",
          standards: ["ERC721", "ERC1155"],
          interfaces: ["IERC721", "IERC1155"],
          libraries: ["@openzeppelin/contracts"],
          frontendLibraries: ["ethers.js", "web3.js", "@avalabs/avalanchejs"],
        },
        dapp: {
          name: "Avalanche dApp",
          description: "Decentralized application on Avalanche C-Chain",
          frameworks: ["Hardhat", "AvalancheJS"],
          frontendLibraries: ["ethers.js", "web3.js", "@avalabs/avalanchejs"],
        }
      },
      arbitrum: {
        token: {
          name: "Arbitrum Token",
          description: "Token on Arbitrum L2 network",
          standards: ["ERC20"],
          interfaces: ["IERC20"],
          libraries: ["@openzeppelin/contracts"],
          frontendLibraries: ["ethers.js", "web3.js", "wagmi", "@arbitrum/sdk"],
        },
        nft: {
          name: "Arbitrum NFT Collection",
          description: "NFT collection on Arbitrum L2 network",
          standards: ["ERC721"],
          interfaces: ["IERC721", "IERC721Metadata"],
          libraries: ["@openzeppelin/contracts"],
          frontendLibraries: ["ethers.js", "web3.js", "wagmi", "@arbitrum/sdk"],
        },
        dapp: {
          name: "Arbitrum dApp",
          description: "Decentralized application on Arbitrum L2 network",
          frameworks: ["Hardhat", "Foundry"],
          frontendLibraries: ["ethers.js", "web3.js", "wagmi", "@arbitrum/sdk"],
        }
      }
    };
    
    // Blockchain-specific templates
    this.blockchainTemplates = {
      ethereum: {
        contractGeneration: 
          "You are an expert Ethereum developer specializing in smart contract creation. " +
          "Generate a secure, gas-optimized Ethereum smart contract based on the following requirements. " +
          "Make sure to follow best practices such as the checks-effects-interactions pattern, " +
          "reentrancy guards, and proper access control.\n\n",
          
        frontendGeneration:
          "You are an expert Web3 frontend developer specializing in Ethereum dApps. " +
          "Create a modern, responsive React component that interfaces with Ethereum using ethers.js/web3.js " +
          "based on the following specifications:\n\n"
      },
      solana: {
        contractGeneration: 
          "You are an expert Solana developer specializing in program creation. " +
          "Generate a secure, optimized Solana program based on the following requirements. " +
          "When applicable, use the Anchor framework for improved security and development experience.\n\n",
          
        frontendGeneration:
          "You are an expert Web3 frontend developer specializing in Solana dApps. " +
          "Create a modern, responsive React component that interfaces with Solana using @solana/web3.js " +
          "based on the following specifications:\n\n"
      },
      bnbchain: {
        contractGeneration: 
          "You are an expert BNB Chain developer specializing in smart contract creation. " +
          "Generate a secure, gas-optimized BNB Chain smart contract based on the following requirements. " +
          "Make sure to follow best practices such as the checks-effects-interactions pattern, " +
          "reentrancy guards, and proper access control. BNB Chain is EVM-compatible and uses similar " +
          "patterns to Ethereum but with different gas economics.\n\n",
          
        frontendGeneration:
          "You are an expert Web3 frontend developer specializing in BNB Chain dApps. " +
          "Create a modern, responsive React component that interfaces with BNB Chain using ethers.js/web3.js " +
          "based on the following specifications:\n\n"
      },
      base: {
        contractGeneration: 
          "You are an expert Base developer specializing in smart contract creation. " +
          "Generate a secure, gas-optimized Base smart contract based on the following requirements. " +
          "Base is an Ethereum L2 built on the OP Stack, so it's fully EVM-compatible. " +
          "Make sure to follow best practices such as the checks-effects-interactions pattern, " +
          "reentrancy guards, and proper access control.\n\n",
          
        frontendGeneration:
          "You are an expert Web3 frontend developer specializing in Base dApps. " +
          "Create a modern, responsive React component that interfaces with Base using ethers.js/web3.js/viem " +
          "based on the following specifications:\n\n"
      },
      polygon: {
        contractGeneration: 
          "You are an expert Polygon developer specializing in smart contract creation. " +
          "Generate a secure, gas-optimized Polygon smart contract based on the following requirements. " +
          "Polygon is an Ethereum sidechain with high throughput and low fees. " +
          "Make sure to follow best practices such as the checks-effects-interactions pattern, " +
          "reentrancy guards, and proper access control. Consider Polygon's gas optimizations and " +
          "transaction throughput when designing your solution.\n\n",
          
        frontendGeneration:
          "You are an expert Web3 frontend developer specializing in Polygon dApps. " +
          "Create a modern, responsive React component that interfaces with Polygon using ethers.js/web3.js " +
          "and @maticnetwork/maticjs based on the following specifications. Consider Polygon's high " +
          "transaction throughput and low latency when designing your UI/UX flow.\n\n"
      },
      avalanche: {
        contractGeneration: 
          "You are an expert Avalanche developer specializing in smart contract creation. " +
          "Generate a secure, gas-optimized Avalanche C-Chain smart contract based on the following requirements. " +
          "Avalanche C-Chain is EVM-compatible with high throughput and fast finality. " +
          "Make sure to follow best practices such as the checks-effects-interactions pattern, " +
          "reentrancy guards, and proper access control. Consider Avalanche's subnet architecture " +
          "and consensus mechanism when designing your solution.\n\n",
          
        frontendGeneration:
          "You are an expert Web3 frontend developer specializing in Avalanche dApps. " +
          "Create a modern, responsive React component that interfaces with Avalanche C-Chain using " +
          "ethers.js/web3.js and @avalabs/avalanchejs based on the following specifications. " +
          "Consider Avalanche's fast finality and cross-subnet capabilities when designing your UI/UX flow.\n\n"
      },
      arbitrum: {
        contractGeneration: 
          "You are an expert Arbitrum developer specializing in smart contract creation. " +
          "Generate a secure, gas-optimized Arbitrum smart contract based on the following requirements. " +
          "Arbitrum is an Ethereum L2 using Optimistic Rollups for high throughput and lower fees. " +
          "Make sure to follow best practices such as the checks-effects-interactions pattern, " +
          "reentrancy guards, and proper access control. Consider Arbitrum's L1-to-L2 messaging system " +
          "and delayed finality model when designing your solution.\n\n",
          
        frontendGeneration:
          "You are an expert Web3 frontend developer specializing in Arbitrum dApps. " +
          "Create a modern, responsive React component that interfaces with Arbitrum using ethers.js/web3.js " +
          "and @arbitrum/sdk based on the following specifications. Consider Arbitrum's L2 characteristics " +
          "and optimistic rollup confirmation times when designing your UI/UX flow.\n\n"
      }
    };
    
    // Common prompt templates
    this.templates = {
      contractGeneration: 
        "You are an expert Web3 developer specializing in smart contract creation. " +
        "Generate a secure, optimized smart contract based on the following requirements:\n\n",
      
      frontendGeneration:
        "You are an expert Web3 frontend developer. " +
        "Create a modern, responsive React component that interfaces with blockchain using the following specifications:\n\n",
        
      projectStructure:
        "You are an expert in Web3 project architecture. " +
        "Create a comprehensive project structure for the following Web3 application:\n\n",
        
      debugHelper:
        "You are an expert Web3 developer specialized in debugging blockchain applications. " +
        "Analyze the following code and/or error message and suggest detailed fixes:\n\n",
        
      securityAudit:
        "You are an expert Web3 security auditor. " +
        "Conduct a thorough security review of the following smart contract code, " +
        "identifying potential vulnerabilities, optimization opportunities, and best practice violations:\n\n",
        
      testFile:
        "You are an expert Web3 developer specializing in testing smart contracts. " +
        "Generate a comprehensive test file for the following blockchain and test framework. " +
        "Include tests for all major functionality, edge cases, and security considerations:\n\n",
        
      deploymentScript:
        "You are an expert Web3 developer specializing in smart contract deployment. " +
        "Generate a deployment script for the following blockchain and network. " +
        "Include proper error handling, gas optimization, and deployment verification:\n\n",
        
      multiChainConfig:
        "You are an expert Web3 architect specializing in multi-chain applications. " +
        "Generate a configuration for a multi-chain application supporting the following blockchains. " +
        "Include network configurations, contract addresses, and cross-chain communication strategies:\n\n"
    };
  }

  /**
   * Generate smart contract code from description
   * @param {string} description - Project description
   * @param {string} contractType - Type of contract (token, nft, dapp)
   * @param {Object} options - Additional options (blockchain, network, etc.)
   * @returns {Promise<string>} - Generated contract code
   */
  async generateContract(description, contractType, options = {}) {
    const blockchain = options.blockchain || this.config.defaultBlockchain;
    const network = options.network || 'devnet';
    
    // Validate blockchain and contract type
    if (!this.contractTypes[blockchain]) {
      throw new Error(`Unsupported blockchain: ${blockchain}`);
    }
    
    if (!this.contractTypes[blockchain][contractType]) {
      throw new Error(`Unsupported contract type '${contractType}' for blockchain '${blockchain}'`);
    }
    
    // Get contract type details
    const contractTypeDetails = this.contractTypes[blockchain][contractType];
    
    // Get network details if available
    const networkDetails = this.blockchainNetworks[blockchain] && this.blockchainNetworks[blockchain][network] 
      ? this.blockchainNetworks[blockchain][network] 
      : null;
    
    // Select the appropriate prompt template based on blockchain
    let promptTemplate;
    if (this.blockchainTemplates[blockchain] && this.blockchainTemplates[blockchain].contractGeneration) {
      promptTemplate = this.blockchainTemplates[blockchain].contractGeneration;
    } else {
      promptTemplate = this.templates.contractGeneration;
      console.warn(`No specific template found for ${blockchain}, using default template`);
    }
    
    // Build a more detailed prompt with blockchain-specific information
    let prompt = promptTemplate;
    
    // Add contract type specific details
    prompt += `Contract Type: ${contractTypeDetails.name}\n`;
    prompt += `Blockchain: ${blockchain}\n`;
    prompt += `Project Description: ${description}\n\n`;
    
    prompt += "Technical Details:\n";
    
    // Add standards information
    if (contractTypeDetails.standards && contractTypeDetails.standards.length > 0) {
      prompt += `- Standards: ${contractTypeDetails.standards.join(', ')}\n`;
    }
    
    // Add interfaces information for Ethereum
    if (blockchain === 'ethereum' && contractTypeDetails.interfaces && contractTypeDetails.interfaces.length > 0) {
      prompt += `- Interfaces: ${contractTypeDetails.interfaces.join(', ')}\n`;
    }
    
    // Add program information for Solana
    if (blockchain === 'solana' && contractTypeDetails.programs && contractTypeDetails.programs.length > 0) {
      prompt += `- Programs: ${contractTypeDetails.programs.join(', ')}\n`;
    }
    
    // Add libraries/frameworks information
    if (contractTypeDetails.libraries && contractTypeDetails.libraries.length > 0) {
      prompt += `- Libraries: ${contractTypeDetails.libraries.join(', ')}\n`;
    } else if (contractTypeDetails.frameworks && contractTypeDetails.frameworks.length > 0) {
      prompt += `- Frameworks: ${contractTypeDetails.frameworks.join(', ')}\n`;
    }
    
    // Add network information if available
    if (networkDetails) {
      prompt += `\nNetwork: ${networkDetails.name}\n`;
      
      if (blockchain === 'ethereum') {
        prompt += `- Chain ID: ${networkDetails.chainId}\n`;
      }
    }
    
    // Add any additional requirements
    if (options.additionalRequirements) {
      prompt += `\nAdditional Requirements: ${options.additionalRequirements}\n`;
    }
    
    prompt += "\nPlease generate a secure, well-documented smart contract with appropriate error handling and security best practices. ";
    
    // Add blockchain-specific instructions
    if (blockchain === 'ethereum') {
      prompt += "Ensure the contract is gas-optimized and follows Ethereum security best practices including reentrancy protection and proper access control.";
    } else if (blockchain === 'solana') {
      prompt += "Ensure the program follows Solana's account model and security best practices.";
    }
    
    // Enhance prompt with external framework integration information
    prompt = this.enhancePromptWithFrameworks(prompt, blockchain);
    
    return this.sendPrompt(prompt, {
      maxTokens: options.maxTokens || this.config.maxTokens,
      temperature: options.temperature || this.config.temperature
    });
  }

  /**
   * Generate frontend code from description
   * @param {string} description - Project description
   * @param {string} projectType - Type of project (token, nft, dapp)
   * @param {Object} options - Additional options (blockchain, framework, network, etc.)
   * @returns {Promise<string>} - Generated frontend code
   */
  async generateFrontend(description, projectType, options = {}) {
    const blockchain = options.blockchain || this.config.defaultBlockchain;
    const network = options.network || 'devnet';
    const framework = options.framework || 'react';
    
    // Validate blockchain and project type
    if (!this.contractTypes[blockchain]) {
      throw new Error(`Unsupported blockchain: ${blockchain}`);
    }
    
    if (!this.contractTypes[blockchain][projectType]) {
      throw new Error(`Unsupported project type '${projectType}' for blockchain '${blockchain}'`);
    }
    
    // Get project type details
    const projectTypeDetails = this.contractTypes[blockchain][projectType];
    
    // Get network details if available
    const networkDetails = this.blockchainNetworks[blockchain] && this.blockchainNetworks[blockchain][network] 
      ? this.blockchainNetworks[blockchain][network] 
      : null;
    
    // Select the appropriate prompt template based on blockchain
    let promptTemplate;
    if (this.blockchainTemplates[blockchain] && this.blockchainTemplates[blockchain].frontendGeneration) {
      promptTemplate = this.blockchainTemplates[blockchain].frontendGeneration;
    } else {
      promptTemplate = this.templates.frontendGeneration;
      console.warn(`No specific template found for ${blockchain}, using default template`);
    }
    
    // Build a more detailed prompt with blockchain-specific information
    let prompt = promptTemplate;
    
    // Add project details
    prompt += `Project Type: ${projectTypeDetails.name}\n`;
    prompt += `Blockchain: ${blockchain}\n`;
    prompt += `Framework: ${framework}\n`;
    prompt += `Project Description: ${description}\n\n`;
    
    prompt += "Technical Details:\n";
    
    // Add frontend libraries information
    if (projectTypeDetails.frontendLibraries && projectTypeDetails.frontendLibraries.length > 0) {
      prompt += `- Frontend Libraries: ${projectTypeDetails.frontendLibraries.join(', ')}\n`;
    }
    
    // Add blockchain-specific wallet integration instructions
    prompt += "- Wallet Integration: ";
    if (blockchain === 'ethereum') {
      prompt += "Integrate with MetaMask and other Ethereum wallets using ethers.js or web3.js\n";
    } else if (blockchain === 'solana') {
      prompt += "Integrate with Phantom, Solflare and other Solana wallets using @solana/wallet-adapter\n";
    }
    
    // Add component name if provided
    if (options.componentName) {
      prompt += `\nComponent Name: ${options.componentName}\n`;
    }
    
    // Add network information if available
    if (networkDetails) {
      prompt += `\nNetwork: ${networkDetails.name}\n`;
      
      if (blockchain === 'ethereum') {
        prompt += `- Chain ID: ${networkDetails.chainId}\n`;
        prompt += `- RPC URL: ${networkDetails.rpcUrl}\n`;
      } else if (blockchain === 'solana') {
        prompt += `- Cluster URL: ${networkDetails.url}\n`;
      }
      
      prompt += `- Explorer: ${networkDetails.explorerUrl}\n`;
    }
    
    // Add any additional requirements
    if (options.additionalRequirements) {
      prompt += `\nAdditional Requirements: ${options.additionalRequirements}\n`;
    }
    
    prompt += "\nPlease generate clean, responsive UI components with proper Web3 wallet integration and robust error handling. ";
    
    // Add blockchain-specific instructions
    if (blockchain === 'ethereum') {
      prompt += "Include transaction confirmation feedback and gas estimation where appropriate. Handle network switching and chain ID validation.";
    } else if (blockchain === 'solana') {
      prompt += "Implement proper transaction confirmation and signature verification. Handle RPC connection errors and network switching.";
    }
    
    // Enhance prompt with external framework integration information
    prompt = this.enhancePromptWithFrameworks(prompt, blockchain);
    
    return this.sendPrompt(prompt, {
      maxTokens: options.maxTokens || this.config.maxTokens,
      temperature: options.temperature || this.config.temperature
    });
  }

  /**
   * Generate project structure from description
   * @param {string} description - Project description
   * @returns {Promise<object>} - Project structure as object
   */
  async generateProjectStructure(description, options = {}) {
    const blockchain = options.blockchain || this.config.defaultBlockchain;
    
    let prompt = this.templates.projectStructure + 
      `Project Description: ${description}\n` +
      `Blockchain: ${blockchain}\n\n` +
      "Please provide a comprehensive directory and file structure suitable for this Web3 project.";
    
    // Enhance prompt with external framework integration information
    prompt = this.enhancePromptWithFrameworks(prompt, blockchain);
    
    const response = await this.sendPrompt(prompt);
    try {
      // Attempt to parse the response as a structured object
      return this.parseProjectStructure(response);
    } catch (error) {
      console.error("Failed to parse project structure", error);
      return { rawResponse: response };
    }
  }

  /**
   * Send prompt to Claude API with retry mechanism
   * @param {string} prompt - The prompt to send
   * @param {Object} options - Options for the API call
   * @returns {Promise<string>} - Claude's response
   */
  async sendPrompt(prompt, options = {}) {
    const maxRetries = options.maxRetries || this.config.maxRetries;
    const retryDelay = options.retryDelay || this.config.retryDelay;
    const model = options.model || this.config.model;
    const maxTokens = options.maxTokens || this.config.maxTokens;
    const temperature = options.temperature || this.config.temperature;
    
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        const response = await this.client.messages.create({
          model: model,
          max_tokens: maxTokens,
          temperature: temperature,
          messages: [
            { role: "user", content: prompt }
          ]
        });
        
        if (!response.content || !response.content[0] || !response.content[0].text) {
          throw new Error("Received empty response from Claude API");
        }
        
        return response.content[0].text;
      } catch (error) {
        console.error(`Attempt ${attempt}/${maxRetries + 1} failed:`, error);
        lastError = error;
        
        // If not the last attempt, wait before retrying
        if (attempt <= maxRetries) {
          const waitTime = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`Retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    // If we get here, all attempts failed
    throw new Error(`Failed to generate content after ${maxRetries + 1} attempts: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Detect external framework availability
   * @returns {Promise<void>}
   */
  async detectFrameworks() {
    try {
      // Check LangChain availability
      if (this.config.useLangchain) {
        this.frameworks.langchain.available = await isFrameworkAvailable(this.frameworks.langchain.path);
        if (this.frameworks.langchain.available) {
          console.log('LangChain framework available, integration enabled');
        } else {
          console.warn('LangChain framework not available, will use built-in functionality');
        }
      }
      
      // Check Solana Web3 availability
      if (this.config.useSolanaWeb3) {
        this.frameworks.solanaWeb3.available = await isFrameworkAvailable(this.frameworks.solanaWeb3.path);
        if (this.frameworks.solanaWeb3.available) {
          console.log('Solana Web3 framework available, integration enabled');
        } else {
          console.warn('Solana Web3 framework not available, will use built-in functionality');
        }
      }
    } catch (error) {
      console.error('Error detecting external frameworks:', error);
    }
  }
  
  /**
   * Get advanced framework support information for specific blockchain
   * @param {string} blockchain - Blockchain name (ethereum, solana)
   * @returns {Object} - Framework support information
   */
  getBlockchainFrameworkSupport(blockchain) {
    const support = {
      available: false,
      frameworks: []
    };
    
    if (blockchain === 'ethereum') {
      // Ethereum-related framework support
      if (this.frameworks.langchain.available) {
        support.available = true;
        support.frameworks.push('langchain');
      }
    } else if (blockchain === 'solana') {
      // Solana-related framework support
      if (this.frameworks.solanaWeb3.available) {
        support.available = true;
        support.frameworks.push('solana-web3');
      }
    }
    
    return support;
  }
  
  /**
   * Enhance project generation prompt with external framework integration information
   * @param {string} prompt - Original prompt
   * @param {string} blockchain - Blockchain type (ethereum, solana)
   * @returns {string} - Enhanced prompt
   */
  enhancePromptWithFrameworks(prompt, blockchain) {
    const frameworkSupport = this.getBlockchainFrameworkSupport(blockchain);
    
    if (frameworkSupport.available) {
      const frameworks = frameworkSupport.frameworks.join(', ');
      prompt += `\n\nAdditional Framework Integration:\nThis project should leverage the following integrated frameworks: ${frameworks}.\n`;
      
      if (blockchain === 'solana' && frameworkSupport.frameworks.includes('solana-web3')) {
        prompt += `Use @solana/web3.js for Solana blockchain interactions, wallet connectivity, and transaction handling.\n`;
      }
      
      if (frameworkSupport.frameworks.includes('langchain')) {
        prompt += `Use LangChain for enhanced AI capabilities, prompting, and workflow management.\n`;
      }
    }
    
    return prompt;
  }

  /**
   * Parse project structure from Claude's response
   * @param {string} response - Raw response from Claude
   * @returns {object} - Parsed project structure
   */
  parseProjectStructure(response) {
    // This is a simplified implementation
    // In a real scenario, we'd need more robust parsing
    const structureLines = response.split('\n').filter(line => line.trim());
    const structure = {};
    
    let currentPath = [];
    let currentIndent = 0;
    
    structureLines.forEach(line => {
      const indent = line.search(/\S/);
      const item = line.trim();
      
      if (indent > currentIndent) {
        // Going deeper in the tree
      } else if (indent < currentIndent) {
        // Going back up the tree
        const levelsUp = (currentIndent - indent) / 2;
        currentPath = currentPath.slice(0, -levelsUp);
      }
      
      currentIndent = indent;
      
      if (item.endsWith('/') || !item.includes('.')) {
        // It's a directory
        currentPath.push(item.replace('/', ''));
      } else {
        // It's a file
        const currentObj = currentPath.reduce((obj, path) => {
          obj[path] = obj[path] || {};
          return obj[path];
        }, structure);
        
        currentObj[item] = null;
      }
    });
    
    return structure;
  }

  /**
   * Generate test files
   * @param {string} blockchain - Blockchain type (ethereum, solana)
   * @param {string} framework - Test framework (hardhat, truffle, anchor)
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - Generated test file content
   */
  async generateTestFile(blockchain, framework, options = {}) {
    try {
      // Select appropriate prompt template
      let prompt = this.templates.testFile;
      
      prompt += `Blockchain: ${blockchain}\n`;
      prompt += `Test Framework: ${framework}\n`;
      
      if (options.projectDir) {
        prompt += `Project Directory: ${options.projectDir}\n`;
      }
      
      if (options.contractCode) {
        prompt += `Contract Code:\n\`\`\`\n${options.contractCode}\n\`\`\`\n`;
      }
      
      // Generate test file
      const response = await this.createCompletion(prompt);
      
      // Extract code block
      const codeMatch = response.match(/```(?:javascript|typescript|js|ts|solidity)\n([\s\S]*?)\n```/);
      if (codeMatch && codeMatch[1]) {
        return codeMatch[1];
      }
      
      return response;
    } catch (error) {
      console.error('Failed to generate test file:', error);
      throw error;
    }
  }

  /**
   * Generate deployment script
   * @param {string} blockchain - Blockchain type (ethereum, solana)
   * @param {string} contract - Contract code
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - Generated deployment script content
   */
  async generateDeploymentScript(blockchain, contract, options = {}) {
    try {
      // Select appropriate prompt template
      let prompt = this.templates.deploymentScript;
      
      prompt += `Blockchain: ${blockchain}\n`;
      
      if (options.testnet) {
        prompt += `Testnet: ${options.testnet}\n`;
      }
      
      if (options.mainnet) {
        prompt += `Mainnet: ${options.mainnet}\n`;
      }
      
      prompt += `Contract Code:\n\`\`\`\n${contract}\n\`\`\`\n`;
      
      // Generate deployment script
      const response = await this.createCompletion(prompt);
      
      // Extract code block
      const codeMatch = response.match(/```(?:javascript|typescript|js|ts|solidity)\n([\s\S]*?)\n```/);
      if (codeMatch && codeMatch[1]) {
        return codeMatch[1];
      }
      
      return response;
    } catch (error) {
      console.error('Failed to generate deployment script:', error);
      throw error;
    }
  }

  /**
   * Generate multi-chain configuration
   * @param {string} primaryBlockchain - Primary blockchain
   * @param {Array<string>} additionalBlockchains - Additional supported blockchains
   * @returns {Promise<Object>} - Generated multi-chain configuration
   */
  async generateMultiChainConfig(primaryBlockchain, additionalBlockchains) {
    try {
      // Select appropriate prompt template
      let prompt = this.templates.multiChainConfig;
      
      prompt += `Primary Blockchain: ${primaryBlockchain}\n`;
      prompt += `Additional Blockchains: ${additionalBlockchains.join(', ')}\n`;
      
      // Generate multi-chain configuration
      const response = await this.createCompletion(prompt);
      
      // Parse response
      try {
        // Extract JSON
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
          return JSON.parse(jsonMatch[1]);
        }
        
        // If no JSON found, return original response
        return {
          rawResponse: response,
          primaryBlockchain,
          additionalBlockchains
        };
      } catch (parseError) {
        console.error('Failed to parse multi-chain configuration:', parseError);
        return {
          rawResponse: response,
          primaryBlockchain,
          additionalBlockchains,
          parseError: parseError.message
        };
      }
    } catch (error) {
      console.error('Failed to generate multi-chain configuration:', error);
      throw error;
    }
  }

  /**
   * Generate cross-chain bridge code
   * @param {Array<string>} blockchains - List of blockchains to bridge
   * @returns {Promise<string>} - Generated bridge code
   */
  async generateBridgeCode(blockchains) {
    try {
      // Validate input
      if (!Array.isArray(blockchains) || blockchains.length < 2) {
        throw new Error('At least two blockchains are required to generate bridge code');
      }

      // Check if all blockchains are supported
      for (const blockchain of blockchains) {
        if (!this.blockchainNetworks[blockchain]) {
          throw new Error(`Unsupported blockchain: ${blockchain}`);
        }
      }

      // Determine bridge types, protocols, and configurations
      const { bridgeTypes, protocols, bridgeConfigurations } = this.determineBridgeTypes(blockchains);
      
      
      // Generate detailed configuration for each protocol
      const protocolConfigs = {};
      for (const protocol of protocols) {
        try {
          console.log(`Generating detailed configuration for ${protocol}...`);
          const config = await this.generateProtocolSpecificConfig(protocol, blockchains);
          protocolConfigs[protocol] = config;
        } catch (configError) {
          console.warn(`Error generating ${protocol} configuration:`, configError);
          // If configuration generation fails, continue processing other protocols
        }
      }
      
      // Create prompt
      let prompt = `You are a professional cross-chain development expert. Please generate cross-chain bridge code for the following blockchains:\n\n`;
      prompt += `Blockchains: ${blockchains.join(', ')}\n\n`;
      prompt += `Bridge types: ${bridgeTypes.join(', ')}\n\n`;
      prompt += `Protocols: ${protocols.join(', ')}\n\n`;
      
      // Add blockchain-specific information
      prompt += `Please generate a complete bridge module with the following features:\n`;
      prompt += `1. Functions to transfer assets between these blockchains (supporting ERC20, ERC721, and native tokens)\n`;
      prompt += `2. Cross-chain messaging functionality (synchronous and asynchronous modes)\n`;
      prompt += `3. State validation and security checks (including fraud proofs and optimistic rollback mechanisms)\n`;
      prompt += `4. Error handling and recovery mechanisms (including transaction retry and rollback)\n`;
      prompt += `5. Necessary configuration and initialization code\n`;
      prompt += `6. Liquidity management and fee handling\n`;
      prompt += `7. Cross-chain event listening and processing\n\n`;
      
      // Add specific bridge requirements
      prompt += `Please use the following cross-chain bridge libraries and protocols:\n`;
      
      // Add corresponding libraries based on determined protocols
      if (protocols.includes('Axelar Network')) {
        prompt += `- @axelar-network/axelarjs-sdk\n`;
      }
      if (protocols.includes('LayerZero')) {
        prompt += `- @layerzerolabs/lz-sdk\n`;
      }
      if (protocols.includes('Wormhole')) {
        prompt += `- @wormhole-foundation/sdk\n`;
      }
      if (protocols.includes('Chainlink CCIP')) {
        prompt += `- @chainlink/contracts-ccip\n`;
      }
      if (protocols.includes('Hyperlane')) {
        prompt += `- @hyperlane-xyz/sdk\n`;
      }
      if (protocols.includes('Connext')) {
        prompt += `- @connext/sdk\n`;
      }
      
      // Add bridge configuration information
      prompt += `\nBasic bridge configuration information:\n`;
      for (const [chainPair, config] of Object.entries(bridgeConfigurations)) {
        prompt += `- ${chainPair}: ${JSON.stringify(config)}\n`;
      }
      
      // Add detailed protocol configuration
      prompt += `\nDetailed protocol configuration:\n`;
      for (const [protocol, config] of Object.entries(protocolConfigs)) {
        prompt += `- ${protocol}: ${JSON.stringify(config)}\n`;
      }
      
      prompt += `\nThe code should be modular and easy to integrate into existing projects. Please provide detailed comments, usage examples, and error handling mechanisms.\n`;
      prompt += `The generated code should include a main bridge class and protocol-specific adapter classes to easily switch between different bridge protocols.\n`;
      prompt += `Also, please include a simple CLI tool for testing and demonstrating bridge functionality.\n`;
      
      // Generate bridge code
      console.log('Generating cross-chain bridge code...');
      const response = await this.createCompletion(prompt);
      
      // Extract code blocks
      const codeMatch = response.match(/```(?:javascript|typescript|js|ts)\n([\s\S]*?)\n```/);
      if (codeMatch && codeMatch[1]) {
        return codeMatch[1];
      }
      
      return response;
    } catch (error) {
      console.error('Failed to generate bridge code:', error);
      throw error;
    }
  }
  
  /**
   * Determine bridge types, protocols, and configurations suitable for the given blockchain combination
   * @param {Array<string>} blockchains - List of blockchains
   * @returns {Object} - Object containing bridge types, protocols, and configurations
   * @private
   */
  determineBridgeTypes(blockchains) {
    const bridgeTypes = [];
    const protocols = [];
    const bridgeConfigurations = {};
    
    // Check if various types of blockchains are included
    const evmChains = blockchains.filter(chain => 
      ['ethereum', 'bnbchain', 'base', 'polygon', 'avalanche', 'arbitrum'].includes(chain));
    const hasSolana = blockchains.includes('solana');
    const hasPolygon = blockchains.includes('polygon');
    const hasAvalanche = blockchains.includes('avalanche');
    const hasArbitrum = blockchains.includes('arbitrum');
    
    // Determine bridge types and protocols
    if (evmChains.length > 0 && hasSolana) {
      // Bridge between EVM and Solana
      bridgeTypes.push('EVM-Solana Bridge');
      protocols.push('Wormhole');
      protocols.push('Chainlink CCIP');
      
      // Configure bridge information for each chain pair
      evmChains.forEach(evmChain => {
        const chainPair = `${evmChain}-solana`;
        bridgeConfigurations[chainPair] = {
          primaryProtocol: 'Wormhole',
          backupProtocol: 'Chainlink CCIP',
          gasToken: evmChain === 'ethereum' ? 'ETH' : evmChain === 'bnbchain' ? 'BNB' : 'MATIC',
          estimatedFee: '0.001',
          confirmationBlocks: evmChain === 'ethereum' ? 12 : 5,
          timeEstimate: '10-30 minutes'
        };
      });
    }
    
    if (evmChains.length > 1) {
      // Bridge between EVM-compatible chains
      bridgeTypes.push('EVM-to-EVM Bridge');
      protocols.push('Axelar Network');
      protocols.push('LayerZero');
      protocols.push('Hyperlane');
      protocols.push('Connext');
      
      // Configure bridge information for each EVM chain pair
      for (let i = 0; i < evmChains.length; i++) {
        for (let j = i + 1; j < evmChains.length; j++) {
          const chain1 = evmChains[i];
          const chain2 = evmChains[j];
          const chainPair = `${chain1}-${chain2}`;
          
          // Select the best protocol based on chain pair
          let primaryProtocol = 'LayerZero';
          let backupProtocol = 'Axelar Network';
          
          // Handle special cases
          if ((chain1 === 'ethereum' && chain2 === 'polygon') || 
              (chain1 === 'polygon' && chain2 === 'ethereum')) {
            primaryProtocol = 'Polygon PoS Bridge';
            backupProtocol = 'LayerZero';
          } else if ((chain1 === 'ethereum' && chain2 === 'arbitrum') || 
                     (chain1 === 'arbitrum' && chain2 === 'ethereum')) {
            primaryProtocol = 'Arbitrum Bridge';
            backupProtocol = 'LayerZero';
          } else if ((chain1 === 'ethereum' && chain2 === 'avalanche') || 
                     (chain1 === 'avalanche' && chain2 === 'ethereum')) {
            primaryProtocol = 'Avalanche Bridge';
            backupProtocol = 'Axelar Network';
          }
          
          bridgeConfigurations[chainPair] = {
            primaryProtocol,
            backupProtocol,
            gasToken: chain1 === 'ethereum' ? 'ETH' : chain1 === 'bnbchain' ? 'BNB' : 'MATIC',
            estimatedFee: '0.0005',
            confirmationBlocks: chain1 === 'ethereum' || chain2 === 'ethereum' ? 12 : 5,
            timeEstimate: '5-15 minutes'
          };
        }
      }
    }
    
    // Handle specific chain combinations
    if (hasPolygon) {
      if (blockchains.includes('ethereum')) {
        bridgeTypes.push('Polygon PoS Bridge');
        protocols.push('Polygon PoS');
      }
    }
    
    if (hasAvalanche) {
      if (blockchains.includes('ethereum')) {
        bridgeTypes.push('Avalanche Bridge');
        protocols.push('Avalanche Bridge');
      }
    }
    
    if (hasArbitrum) {
      if (blockchains.includes('ethereum')) {
        bridgeTypes.push('Arbitrum Bridge');
        protocols.push('Arbitrum Bridge');
      }
    }
    
    // Add generic cross-chain messaging protocol
    protocols.push('Chainlink CCIP');
    
    // If no specific bridge type is determined, use generic bridge
    if (bridgeTypes.length === 0) {
      bridgeTypes.push('Generic Cross-Chain Bridge');
      protocols.push('Generic Bridge Protocol');
    }
    
    // Ensure protocol list has no duplicates
    const uniqueProtocols = [...new Set(protocols)];
    
    return {
      bridgeTypes,
      protocols: uniqueProtocols,
      bridgeConfigurations
    };
  }

  /**
   * Generate protocol-specific bridge configuration
   * @param {string} protocol - Bridge protocol name
   * @param {Array<string>} blockchains - List of blockchains to bridge
   * @returns {Promise<Object>} - Generated protocol-specific configuration
   */
  async generateProtocolSpecificConfig(protocol, blockchains) {
    try {
      // Validate input
      if (!protocol || !Array.isArray(blockchains) || blockchains.length < 2) {
        throw new Error('Protocol name and at least two blockchains are required');
      }

      // Create prompt
      let prompt = `You are a professional cross-chain development expert. Please generate specific configurations for the following protocol and blockchains:\n\n`;
      prompt += `Protocol: ${protocol}\n`;
      prompt += `Blockchains: ${blockchains.join(', ')}\n\n`;
      
      // Add specific configuration requirements based on different protocols
      if (protocol === 'Axelar Network') {
        prompt += `Please generate detailed configuration for Axelar Network, including:\n`;
        prompt += `1. Gateway contract addresses\n`;
        prompt += `2. Gas service configuration\n`;
        prompt += `3. Supported token mappings\n`;
        prompt += `4. Chain IDs and RPC endpoints\n`;
      } else if (protocol === 'LayerZero') {
        prompt += `Please generate detailed configuration for LayerZero, including:\n`;
        prompt += `1. Endpoint contract addresses\n`;
        prompt += `2. Chain ID mappings\n`;
        prompt += `3. Application configuration\n`;
        prompt += `4. Gas and fee settings\n`;
      } else if (protocol === 'Wormhole') {
        prompt += `Please generate detailed configuration for Wormhole, including:\n`;
        prompt += `1. Core bridge contract addresses\n`;
        prompt += `2. Token Bridge configuration\n`;
        prompt += `3. Message passing configuration\n`;
        prompt += `4. Chain ID mappings\n`;
      } else if (protocol === 'Chainlink CCIP') {
        prompt += `Please generate detailed configuration for Chainlink CCIP, including:\n`;
        prompt += `1. Router contract addresses\n`;
        prompt += `2. Chain selector mappings\n`;
        prompt += `3. Supported tokens\n`;
        prompt += `4. Fee calculation configuration\n`;
      } else if (protocol === 'Polygon PoS') {
        prompt += `Please generate detailed configuration for Polygon PoS Bridge, including:\n`;
        prompt += `1. Root chain contract addresses\n`;
        prompt += `2. Child chain contract addresses\n`;
        prompt += `3. Checkpoint and validator configuration\n`;
        prompt += `4. Predefined token mappings\n`;
      } else {
        prompt += `Please generate generic configuration for this protocol, including:\n`;
        prompt += `1. Contract addresses\n`;
        prompt += `2. Chain ID or identifier mappings\n`;
        prompt += `3. Supported assets and operations\n`;
        prompt += `4. Security and validation parameters\n`;
      }
      
      prompt += `\nPlease return the configuration in JSON format.\n`;
      
      // Generate configuration
      const response = await this.createCompletion(prompt);
      
      // Extract JSON
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          return JSON.parse(jsonMatch[1]);
        } catch (parseError) {
          console.error('Failed to parse protocol configuration JSON:', parseError);
          return { error: 'Configuration parsing failed', rawResponse: response };
        }
      }
      
      return { rawResponse: response };
    } catch (error) {
      console.error('Failed to generate protocol-specific configuration:', error);
      throw error;
    }
  }

  /**
   * Generate test scripts for cross-chain communication protocols
   * @param {string} protocol - Cross-chain protocol name
   * @param {Array<string>} blockchains - List of blockchains to test
   * @param {Object} options - Test options
   * @returns {Promise<string>} - Generated test script code
   */
  async generateCrossChainTests(protocol, blockchains, options = {}) {
    try {
      // Validate input
      if (!protocol || !Array.isArray(blockchains) || blockchains.length < 2) {
        throw new Error('Protocol name and at least two blockchains are required');
      }

      // Get protocol configuration
      let protocolConfig;
      try {
        protocolConfig = await this.generateProtocolSpecificConfig(protocol, blockchains);
      } catch (configError) {
        console.warn(`Failed to get ${protocol} configuration, will use default configuration:`, configError);
        protocolConfig = { defaultConfig: true };
      }

      // Create prompt
      let prompt = `You are a professional cross-chain development and testing expert. Please generate comprehensive test scripts for the following cross-chain protocol and blockchains:\n\n`;
      prompt += `Protocol: ${protocol}\n`;
      prompt += `Blockchains: ${blockchains.join(', ')}\n\n`;
      
      // Add test requirements
      prompt += `Please generate a comprehensive set of test scripts, including the following test scenarios:\n`;
      prompt += `1. Basic connection tests - Verify all blockchain nodes can connect properly\n`;
      prompt += `2. Asset transfer tests - Test token transfers between different blockchains (native tokens, ERC20, ERC721)\n`;
      prompt += `3. Message passing tests - Test cross-chain message sending and receiving\n`;
      prompt += `4. Error handling tests - Verify how the system handles various error conditions (network interruptions, transaction failures, etc.)\n`;
      prompt += `5. Performance tests - Measure latency and throughput of cross-chain operations\n`;
      prompt += `6. Security tests - Verify the security and integrity of cross-chain operations\n`;
      
      // Add specific test framework requirements
      if (options.testFramework) {
        prompt += `\nPlease use the ${options.testFramework} testing framework.\n`;
      } else {
        prompt += `\nPlease use a modern testing framework suitable for cross-chain testing, such as Hardhat, Truffle, Jest, or Mocha.\n`;
      }
      
      // Add protocol configuration
      prompt += `\nProtocol configuration:\n${JSON.stringify(protocolConfig, null, 2)}\n\n`;
      
      // Add specific test requirements
      if (options.specificTests) {
        prompt += `\nPlease particularly focus on the following test scenarios:\n`;
        options.specificTests.forEach((test, index) => {
          prompt += `${index + 1}. ${test}\n`;
        });
      }
      
      prompt += `\nThe test scripts should be modular, easily extensible, and include detailed comments and documentation. Please provide complete test script code, as well as instructions on how to run these tests.\n`;
      
      // Generate test scripts
      console.log(`Generating cross-chain test scripts for ${protocol}...`);
      const response = await this.createCompletion(prompt);
      
      // Extract code blocks
      const codeMatch = response.match(/```(?:javascript|typescript|js|ts)\n([\s\S]*?)\n```/);
      if (codeMatch && codeMatch[1]) {
        return codeMatch[1];
      }
      
      return response;
    } catch (error) {
      console.error('Failed to generate cross-chain test scripts:', error);
      throw error;
    }
  }

  /**
   * Generate cross-chain monitoring and analysis tools
   * @param {Array<string>} blockchains - List of blockchains to monitor
   * @param {Array<string>} protocols - List of cross-chain protocols to monitor
   * @param {Object} options - Monitoring options
   * @returns {Promise<Object>} - Generated monitoring tool code and configuration
   */
  async generateCrossChainMonitoring(blockchains, protocols = [], options = {}) {
    try {
      // Validate input
      if (!Array.isArray(blockchains) || blockchains.length < 1) {
        throw new Error('At least one blockchain is required to generate monitoring tools');
      }

      // If no protocols are specified, automatically determine possible protocols based on blockchains
      if (!protocols.length) {
        const bridgeInfo = this.determineBridgeTypes(blockchains);
        protocols = bridgeInfo.protocols;
      }

      // Create prompt
      let prompt = `You are a professional cross-chain development and monitoring expert. Please generate comprehensive cross-chain monitoring and analysis tools for the following blockchains and protocols:\n\n`;
      prompt += `Blockchains: ${blockchains.join(', ')}\n`;
      prompt += `Protocols: ${protocols.length ? protocols.join(', ') : 'auto-detect'}\n\n`;
      
      // Add monitoring requirements
      prompt += `Please generate a comprehensive set of cross-chain monitoring and analysis tools, including the following features:\n`;
      prompt += `1. Real-time transaction monitoring - Monitor the status and progress of cross-chain transactions\n`;
      prompt += `2. Liquidity analysis - Analyze the liquidity status of various blockchains and bridge protocols\n`;
      prompt += `3. Security alert system - Detect potential security issues and abnormal activities\n`;
      prompt += `4. Performance metrics dashboard - Display latency, success rate, and fee statistics for cross-chain operations\n`;
      prompt += `5. Historical data analysis - Provide historical transaction and trend analysis\n`;
      prompt += `6. Node health monitoring - Monitor the status and synchronization of relevant blockchain nodes\n`;
      
      // Add specific tech stack requirements
      if (options.techStack) {
        prompt += `\nPlease use the following tech stack: ${options.techStack.join(', ')}\n`;
      } else {
        prompt += `\nPlease use modern monitoring and analysis tech stack, such as Node.js, Express, React, GraphQL, Prometheus, Grafana, etc.\n`;
      }
      
      // Add specific monitoring requirements
      if (options.specificFeatures) {
        prompt += `\nPlease pay special attention to the following monitoring features:\n`;
        options.specificFeatures.forEach((feature, index) => {
          prompt += `${index + 1}. ${feature}\n`;
        });
      }
      
      // Add architecture requirements
      prompt += `\nThe monitoring system should include the following components:\n`;
      prompt += `1. Data collection service - Collect data from various blockchains and protocols\n`;
      prompt += `2. Data processing and analysis service - Process and analyze the collected data\n`;
      prompt += `3. Alert and notification system - Send alerts when anomalies are detected\n`;
      prompt += `4. API service - Provide data access interfaces\n`;
      prompt += `5. User interface - Intuitively display monitoring data and analysis results\n`;
      
      prompt += `\nPlease provide complete monitoring system architecture design, code implementation of main components, configuration files, and deployment instructions. The code should be modular, easily extensible, and include detailed comments and documentation.\n`;
      
      // Generate monitoring tools
      console.log(`Generating cross-chain monitoring tools...`);
      const response = await this.createCompletion(prompt);
      
      // Parse response
      const result = {
        architecture: null,
        components: {},
        configuration: null,
        deploymentGuide: null,
        rawResponse: response
      };
      
      // Extract architecture description
      const architectureMatch = response.match(/## Architecture Design[\s\S]*?(?=##|$)/) || response.match(/## Architecture Design[\s\S]*?(?=##|$)/);
      if (architectureMatch) {
        result.architecture = architectureMatch[0];
      }
      
      // Extract component code
      const componentMatches = response.matchAll(/### ([\w\s]+)[\s\S]*?```(?:javascript|typescript|js|ts)\n([\s\S]*?)\n```/g);
      for (const match of componentMatches) {
        const componentName = match[1].trim();
        const componentCode = match[2];
        result.components[componentName] = componentCode;
      }
      
      // Extract configuration file
      const configMatch = response.match(/### Configuration File[\s\S]*?```(?:json|yaml|yml)\n([\s\S]*?)\n```/) || response.match(/### Configuration File[\s\S]*?```(?:json|yaml|yml)\n([\s\S]*?)\n```/);
      if (configMatch) {
        try {
          result.configuration = configMatch[1];
        } catch (e) {
          result.configuration = configMatch[1];
        }
      }
      
      // Extract deployment guide
      const deploymentMatch = response.match(/## Deployment Instructions[\s\S]*?(?=##|$)/) || response.match(/## Deployment Instructions[\s\S]*?(?=##|$)/);
      if (deploymentMatch) {
        result.deploymentGuide = deploymentMatch[0];
      }
      
      return result;
    } catch (error) {
      console.error('Failed to generate cross-chain monitoring tools:', error);
      throw error;
    }
  }

  /**
   * Enhanced Claude API call method
   * Provides advanced prompt engineering, context management, and response processing capabilities
   * @param {string} prompt - The prompt to send to Claude
   * @param {Object} options - Call options
   * @returns {Promise<string>} - Claude's response
   */
  async callClaudeAPI(prompt, options = {}) {
    try {
      // Default options
      const defaultOptions = {
        maxTokens: this.config.maxTokens,
        temperature: this.config.temperature,
        model: this.config.model,
        systemPrompt: null,
        enhancePrompt: true,
        formatResponse: true,
        extractCode: false,
        codeLanguage: null,
        retainContext: false,
        contextWindow: [],
        domainSpecificKnowledge: {},
        blockchainContext: null,
        maxRetries: this.config.maxRetries,
        retryDelay: this.config.retryDelay
      };

      // Merge options
      const callOptions = { ...defaultOptions, ...options };
      
      // Context management - Maintain conversation history
      let contextualPrompt = prompt;
      if (callOptions.retainContext && callOptions.contextWindow.length > 0) {
        contextualPrompt = `${callOptions.contextWindow.join("\n\n")}\n\n${prompt}`;
      }
      
      // Prompt enhancement - Add domain-specific knowledge
      if (callOptions.enhancePrompt) {
        // Add blockchain-specific context
        if (callOptions.blockchainContext) {
          const { blockchain, network, contractType } = callOptions.blockchainContext;
          
          // Get blockchain-specific information
          if (this.blockchainNetworks[blockchain] && this.blockchainNetworks[blockchain][network]) {
            const networkDetails = this.blockchainNetworks[blockchain][network];
            contextualPrompt = `Blockchain: ${blockchain}\nNetwork: ${networkDetails.name}\n${contractType ? `Contract Type: ${contractType}\n` : ''}${contextualPrompt}`;
          }
          
          // Add blockchain-specific templates
          if (this.blockchainTemplates[blockchain]) {
            const templatePrefix = contractType && this.blockchainTemplates[blockchain][`${contractType}Generation`] 
              ? this.blockchainTemplates[blockchain][`${contractType}Generation`]
              : this.blockchainTemplates[blockchain].contractGeneration || '';
            
            contextualPrompt = `${templatePrefix}\n\n${contextualPrompt}`;
          }
        }
        
        // Add domain-specific knowledge
        if (Object.keys(callOptions.domainSpecificKnowledge).length > 0) {
          let knowledgeSection = "## Domain-Specific Knowledge\n\n";
          for (const [domain, knowledge] of Object.entries(callOptions.domainSpecificKnowledge)) {
            knowledgeSection += `### ${domain}\n${knowledge}\n\n`;
          }
          contextualPrompt = `${knowledgeSection}\n${contextualPrompt}`;
        }
      }
      
      // System prompt - If a custom system prompt is provided
      let systemPrompt = null;
      if (callOptions.systemPrompt) {
        systemPrompt = callOptions.systemPrompt;
      }
      
      // Call Claude API
      console.log(`Calling Claude API (${callOptions.model})...`);
      
      // Retry logic
      let lastError = null;
      for (let attempt = 1; attempt <= callOptions.maxRetries + 1; attempt++) {
        try {
          // Build API request
          const apiRequest = {
            model: callOptions.model,
            max_tokens: callOptions.maxTokens,
            temperature: callOptions.temperature,
            messages: [
              { role: "user", content: contextualPrompt }
            ]
          };
          
          // Add system prompt (if any)
          if (systemPrompt) {
            apiRequest.system = systemPrompt;
          }
          
          // Send request
          const response = await this.client.messages.create(apiRequest);
          
          if (!response.content || !response.content[0] || !response.content[0].text) {
            throw new Error("Received empty response from Claude API");
          }
          
          let responseText = response.content[0].text;
          
          // Response processing - Extract code blocks
          if (callOptions.extractCode && callOptions.codeLanguage) {
            const codeRegex = new RegExp(`\`\`\`(?:${callOptions.codeLanguage})?\\n([\\s\\S]*?)\\n\`\`\``, 'g');
            const matches = [...responseText.matchAll(codeRegex)];
            
            if (matches.length > 0) {
              // Extract all code blocks
              const codeBlocks = matches.map(match => match[1]);
              responseText = codeBlocks.join('\n\n');
            }
          }
          
          // Response formatting
          if (callOptions.formatResponse) {
            // Remove excessive empty lines
            responseText = responseText.replace(/\n{3,}/g, '\n\n');
            // Ensure code blocks are properly formatted
            responseText = responseText.replace(/```([^`\n]*)\n/g, '```$1\n');
          }
          
          // Update context window
          if (callOptions.retainContext) {
            callOptions.contextWindow.push(`User: ${prompt}`);
            callOptions.contextWindow.push(`Assistant: ${responseText}`);
            
            // Keep context window at a reasonable size
            const maxContextItems = 10; // Keep the 5 most recent interactions (10 messages)
            if (callOptions.contextWindow.length > maxContextItems) {
              callOptions.contextWindow = callOptions.contextWindow.slice(-maxContextItems);
            }
          }
          
          return responseText;
        } catch (error) {
          console.error(`Attempt ${attempt}/${callOptions.maxRetries + 1} failed:`, error);
          lastError = error;
          
          // If not the last attempt, wait and retry
          if (attempt <= callOptions.maxRetries) {
            const waitTime = callOptions.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
            console.log(`Will retry in ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }
      
      // If all attempts failed
      throw new Error(`Failed to generate content after ${callOptions.maxRetries + 1} attempts: ${lastError?.message || 'Unknown error'}`);
    } catch (error) {
      console.error('Failed to call Claude API:', error);
      throw error;
    }
  }
  
  /**
   * Enhanced Claude API call method V2
   * Integrates advanced features like streaming response, multi-modal input, response validation
   * @param {string|Object} input - Prompt to send to Claude or multi-modal input object
   * @param {Object} options - Call options
   * @returns {Promise<Object>} - Claude's response and metadata
   */
  async enhancedCallClaudeAPI(input, options = {}) {
    try {
      // Default options
      const defaultOptions = {
        // Basic options
        maxTokens: this.config.maxTokens,
        temperature: this.config.temperature,
        model: this.config.model,
        systemPrompt: null,
        
        // Enhanced feature options
        streamResponse: false,
        validateResponse: false,
        validationCriteria: {},
        multiModal: false,
        extractMetadata: false,
        
        // Code processing options
        extractCode: false,
        useAdvancedCodeExtraction: false,
        codeExtractionOptions: {},
        
        // Context management
        retainContext: false,
        contextWindow: [],
        
        // Domain knowledge
        enhancePrompt: true,
        domainSpecificKnowledge: {},
        blockchainContext: null,
        
        // Error handling
        maxRetries: this.config.maxRetries,
        retryDelay: this.config.retryDelay,
        
        // Callback functions
        onStreamStart: null,
        onStreamUpdate: null,
        onStreamComplete: null,
        onStreamError: null
      };

      // Merge options
      const callOptions = { ...defaultOptions, ...options };
      
      // Process input - support for string or multi-modal objects
      let messages = [];
      
      if (typeof input === 'string') {
        messages = [{ role: "user", content: input }];
      } else if (typeof input === 'object') {
        if (callOptions.multiModal && Array.isArray(input.content)) {
          messages = [{ role: "user", content: input.content }];
        } else {
          messages = [{ role: "user", content: input.text || '' }];
        }
      }
      
      // Enhance prompt - add domain knowledge and blockchain context
      if (callOptions.enhancePrompt) {
        // Add blockchain-specific context
        if (callOptions.blockchainContext) {
          const { blockchain, network, contractType } = callOptions.blockchainContext;
          
          // Get blockchain-specific information
          if (this.blockchainNetworks[blockchain] && this.blockchainNetworks[blockchain][network]) {
            const networkDetails = this.blockchainNetworks[blockchain][network];
            
            // Add blockchain knowledge base content
            if (claudeExtensions.blockchainKnowledgeBase[blockchain]) {
              callOptions.domainSpecificKnowledge[`${blockchain} Knowledge`] = 
                claudeExtensions.blockchainKnowledgeBase[blockchain].securityBestPractices || '';
            }
          }
          
          // Add blockchain-specific templates
          if (this.blockchainTemplates[blockchain]) {
            const templatePrefix = contractType && this.blockchainTemplates[blockchain][`${contractType}Generation`] 
              ? this.blockchainTemplates[blockchain][`${contractType}Generation`]
              : this.blockchainTemplates[blockchain].contractGeneration || '';
            
            if (typeof messages[0].content === 'string') {
              messages[0].content = `${templatePrefix}\n\n${messages[0].content}`;
            }
          }
        }
        
        // Add domain-specific knowledge
        if (Object.keys(callOptions.domainSpecificKnowledge).length > 0) {
          let knowledgeSection = "## Domain-Specific Knowledge\n\n";
          for (const [domain, knowledge] of Object.entries(callOptions.domainSpecificKnowledge)) {
            knowledgeSection += `### ${domain}\n${knowledge}\n\n`;
          }
          
          if (typeof messages[0].content === 'string') {
            messages[0].content = `${knowledgeSection}\n${messages[0].content}`;
          }
        }
      }
      
      // Build API request
      const apiRequest = {
        model: callOptions.model,
        max_tokens: callOptions.maxTokens,
        temperature: callOptions.temperature,
        messages: messages
      };
      
      // Add system prompt (if any)
      if (callOptions.systemPrompt) {
        apiRequest.system = callOptions.systemPrompt;
      }
      
      let responseText = '';
      let responseMetadata = {};
      let extractedCode = null;
      let validationResults = null;
      
      // Stream response processing
      if (callOptions.streamResponse) {
        console.log(`Streaming call to Claude API (${callOptions.model})...`);
        
        // Create stream handler
        const streamHandler = claudeExtensions.createStreamHandler({
          onMessageStart: (chunk) => {
            if (callOptions.onStreamStart) {
              callOptions.onStreamStart(chunk);
            }
          },
          onMessageUpdate: (content, chunk) => {
            if (callOptions.onStreamUpdate) {
              callOptions.onStreamUpdate(content, chunk);
            }
          },
          onMessageComplete: (content) => {
            responseText = content;
            if (callOptions.onStreamComplete) {
              callOptions.onStreamComplete(content);
            }
          },
          onError: (error) => {
            if (callOptions.onStreamError) {
              callOptions.onStreamError(error);
            }
          }
        });
        
        // Retry logic
        let lastError = null;
        for (let attempt = 1; attempt <= callOptions.maxRetries + 1; attempt++) {
          try {
            // Stream API call
            const stream = await this.client.messages.create({
              ...apiRequest,
              stream: true
            });
            
            // Process stream
            for await (const chunk of stream) {
              streamHandler.handleChunk(chunk);
            }
            
            // Get complete response
            responseText = streamHandler.getMessageContent();
            break; // Success, exit retry loop
          } catch (error) {
            console.error(`Stream call attempt ${attempt}/${callOptions.maxRetries + 1} failed:`, error);
            lastError = error;
            
            // If not the last attempt, wait and retry
            if (attempt <= callOptions.maxRetries) {
              const waitTime = callOptions.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
              console.log(`Will retry in ${waitTime}ms...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
            }
          }
        }
        
        // If all attempts fail
        if (!responseText) {
          throw new Error(`Failed to generate content after ${callOptions.maxRetries + 1} attempts: ${lastError?.message || 'Unknown error'}`);
        }
      } else {
        // Standard API call (non-streaming)
        console.log(`Calling Claude API (${callOptions.model})...`);
        
        // Retry logic
        let lastError = null;
        for (let attempt = 1; attempt <= callOptions.maxRetries + 1; attempt++) {
          try {
            // Send request
            const response = await this.client.messages.create(apiRequest);
            
            if (!response.content || !response.content[0] || !response.content[0].text) {
              throw new Error("Received empty response from Claude API");
            }
            
            responseText = response.content[0].text;
            responseMetadata = {
              usage: response.usage,
              id: response.id,
              model: response.model,
              role: response.role,
              stopReason: response.stop_reason,
              stopSequence: response.stop_sequence,
              type: response.type
            };
            
            break; // Success, exit retry loop
          } catch (error) {
            console.error(`API call attempt ${attempt}/${callOptions.maxRetries + 1} failed:`, error);
            lastError = error;
            
            // If not the last attempt, wait and retry
            if (attempt <= callOptions.maxRetries) {
              const waitTime = callOptions.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
              console.log(`Will retry in ${waitTime}ms...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
            }
          }
        }
        
        // If all attempts fail
        if (!responseText) {
          throw new Error(`Failed to generate content after ${callOptions.maxRetries + 1} attempts: ${lastError?.message || 'Unknown error'}`);
        }
      }
      
      // Response validation
      if (callOptions.validateResponse) {
        validationResults = claudeExtensions.validateResponse(responseText, callOptions.validationCriteria);
        
        // If validation fails and regeneration is needed
        if (!validationResults.isValid && callOptions.regenerateOnInvalidResponse) {
          console.log('Response validation failed, regenerating...');
          // Recursive call, but without validation to avoid infinite loop
          return this.enhancedCallClaudeAPI(input, {
            ...callOptions,
            validateResponse: false
          });
        }
      }
      
      // Code extraction
      if (callOptions.extractCode) {
        if (callOptions.useAdvancedCodeExtraction) {
          extractedCode = claudeExtensions.extractCodeBlocks(responseText, callOptions.codeExtractionOptions);
        } else {
          // Simple code extraction
          const codeLanguage = callOptions.codeExtractionOptions?.languages?.[0] || '\\w+';
          const codeRegex = new RegExp(`\`\`\`(?:${codeLanguage})?\\n([\\s\\S]*?)\\n\`\`\``, 'g');
          const matches = [...responseText.matchAll(codeRegex)];
          
          if (matches.length > 0) {
            // Extract all code blocks
            extractedCode = matches.map(match => match[1]);
          }
        }
      }
      
      // Update context window
      if (callOptions.retainContext) {
        // Add user input
        if (typeof input === 'string') {
          callOptions.contextWindow.push(`User: ${input}`);
        } else if (typeof input === 'object') {
          if (input.text) {
            callOptions.contextWindow.push(`User: ${input.text}`);
          }
        }
        
        // Add assistant response
        callOptions.contextWindow.push(`Assistant: ${responseText}`);
        
        // Keep context window at a reasonable size
        const maxContextItems = 10; // Keep the 5 most recent interactions (10 messages)
        if (callOptions.contextWindow.length > maxContextItems) {
          callOptions.contextWindow = callOptions.contextWindow.slice(-maxContextItems);
        }
      }
      
      // Return results
      return {
        text: responseText,
        metadata: responseMetadata,
        code: extractedCode,
        validation: validationResults,
        contextWindow: callOptions.retainContext ? callOptions.contextWindow : undefined
      };
    } catch (error) {
      // Advanced error handling
      const errorInfo = claudeExtensions.handleApiError(error, {
        model: options?.model || this.config.model,
        context: 'enhancedCallClaudeAPI'
      });
      
      console.error('Failed to call Claude API:', errorInfo);
      throw error;
    }
  }
  
  /**
   * Generate cross-chain security audit tool
   * @param {Array<string>} blockchains - List of blockchains
   * @param {Array<string>} protocols - List of protocols
   * @param {Object} options - Other options
   * @returns {Promise<Object>} - Security audit tool code and configuration
   */
  async generateCrossChainSecurityAudit(blockchains, protocols = [], options = {}) {
    try {
      // Validate input
      if (!Array.isArray(blockchains) || blockchains.length < 1) {
        throw new Error('At least one blockchain is required to generate a security audit tool');
      }

      // If no protocols provided, use determineBridgeTypes to determine
      if (!protocols.length && blockchains.length > 1) {
        const bridgeInfo = this.determineBridgeTypes(blockchains);
        protocols = bridgeInfo.protocols;
      }

      // Build prompt
      const prompt = `
# Cross-Chain Security Audit Tool Generation

## Background
I need to create a comprehensive cross-chain security audit tool for the following blockchains:
${blockchains.join(', ')}
