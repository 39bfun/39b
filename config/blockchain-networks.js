/**
 * Blockchain Network Configuration
 * Contains connection information, chain IDs, explorer URLs, etc. for various blockchain networks
 */

module.exports = {
  // Ethereum Networks
  ethereum: {
    mainnet: {
      chainId: 1,
      name: "Ethereum Mainnet",
      rpcUrl: "https://mainnet.infura.io/v3/${INFURA_API_KEY}",
      explorerUrl: "https://etherscan.io",
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18
      }
    },
    sepolia: {
      chainId: 11155111,
      name: "Sepolia Testnet",
      rpcUrl: "https://sepolia.infura.io/v3/${INFURA_API_KEY}",
      explorerUrl: "https://sepolia.etherscan.io",
      nativeCurrency: {
        name: "Sepolia Ether",
        symbol: "ETH",
        decimals: 18
      }
    }
  },
  
  // Solana Networks
  solana: {
    mainnet: {
      name: "Solana Mainnet",
      rpcUrl: "https://api.mainnet-beta.solana.com",
      explorerUrl: "https://explorer.solana.com"
    },
    devnet: {
      name: "Solana Devnet",
      rpcUrl: "https://api.devnet.solana.com",
      explorerUrl: "https://explorer.solana.com/?cluster=devnet"
    }
  },
  
  // BNB Chain Networks
  bnbchain: {
    mainnet: {
      chainId: 56,
      name: "BNB Smart Chain Mainnet",
      rpcUrl: "https://bsc-dataseed.binance.org",
      explorerUrl: "https://bscscan.com",
      nativeCurrency: {
        name: "BNB",
        symbol: "BNB",
        decimals: 18
      }
    },
    testnet: {
      chainId: 97,
      name: "BNB Smart Chain Testnet",
      rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545",
      explorerUrl: "https://testnet.bscscan.com",
      nativeCurrency: {
        name: "BNB",
        symbol: "BNB",
        decimals: 18
      }
    }
  },
  
  // Base Chain Networks
  base: {
    mainnet: {
      chainId: 8453,
      name: "Base Mainnet",
      rpcUrl: "https://mainnet.base.org",
      explorerUrl: "https://basescan.org",
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18
      }
    },
    goerli: {
      chainId: 84531,
      name: "Base Goerli Testnet",
      rpcUrl: "https://goerli.base.org",
      explorerUrl: "https://goerli.basescan.org",
      nativeCurrency: {
        name: "Goerli Ether",
        symbol: "ETH",
        decimals: 18
      }
    }
  },
  
  // Polygon Networks
  polygon: {
    mainnet: {
      chainId: 137,
      name: "Polygon Mainnet",
      rpcUrl: "https://polygon-rpc.com",
      explorerUrl: "https://polygonscan.com",
      nativeCurrency: {
        name: "MATIC",
        symbol: "MATIC",
        decimals: 18
      }
    },
    mumbai: {
      chainId: 80001,
      name: "Polygon Mumbai Testnet",
      rpcUrl: "https://rpc-mumbai.maticvigil.com",
      explorerUrl: "https://mumbai.polygonscan.com",
      nativeCurrency: {
        name: "MATIC",
        symbol: "MATIC",
        decimals: 18
      }
    }
  },
  
  // Arbitrum Networks
  arbitrum: {
    mainnet: {
      chainId: 42161,
      name: "Arbitrum One",
      rpcUrl: "https://arb1.arbitrum.io/rpc",
      explorerUrl: "https://arbiscan.io",
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18
      }
    },
    goerli: {
      chainId: 421613,
      name: "Arbitrum Goerli",
      rpcUrl: "https://goerli-rollup.arbitrum.io/rpc",
      explorerUrl: "https://goerli.arbiscan.io",
      nativeCurrency: {
        name: "Goerli Ether",
        symbol: "ETH",
        decimals: 18
      }
    }
  },
  
  // Avalanche Networks
  avalanche: {
    mainnet: {
      chainId: 43114,
      name: "Avalanche C-Chain",
      rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
      explorerUrl: "https://snowtrace.io",
      nativeCurrency: {
        name: "Avalanche",
        symbol: "AVAX",
        decimals: 18
      }
    },
    fuji: {
      chainId: 43113,
      name: "Avalanche Fuji Testnet",
      rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
      explorerUrl: "https://testnet.snowtrace.io",
      nativeCurrency: {
        name: "Avalanche",
        symbol: "AVAX",
        decimals: 18
      }
    }
  }
};
