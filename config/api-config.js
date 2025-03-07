/**
 * API Configuration
 * Contains configuration information for various API services
 */

module.exports = {
  // Claude API Configuration
  claude: {
    defaultModel: "claude-3-opus-20240229",
    alternativeModels: [
      "claude-3-sonnet-20240229",
      "claude-3-haiku-20240307"
    ],
    defaultMaxTokens: 4000,
    defaultTemperature: 0.7,
    apiEndpoint: "https://api.anthropic.com/v1/messages",
    apiVersion: "2023-06-01",
    maxRetries: 3,
    retryDelay: 1000
  },
  
  // Blockchain API Configuration
  blockchain: {
    // Infura API Configuration
    infura: {
      networks: ["ethereum", "polygon", "optimism", "arbitrum"],
      defaultEndpoint: "https://mainnet.infura.io/v3/${INFURA_API_KEY}"
    },
    
    // Alchemy API Configuration
    alchemy: {
      networks: ["ethereum", "polygon", "optimism", "arbitrum", "solana"],
      defaultEndpoint: "https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}"
    },
    
    // Moralis API Configuration
    moralis: {
      apiEndpoint: "https://deep-index.moralis.io/api/v2",
      supportedChains: [1, 56, 137, 43114, 42161, 10]
    }
  },
  
  // IPFS Configuration
  ipfs: {
    gateway: "https://ipfs.io/ipfs/",
    alternativeGateways: [
      "https://gateway.pinata.cloud/ipfs/",
      "https://cloudflare-ipfs.com/ipfs/"
    ],
    pinningServices: {
      pinata: {
        apiEndpoint: "https://api.pinata.cloud/",
        uploadEndpoint: "https://api.pinata.cloud/pinning/pinFileToIPFS"
      },
      nftStorage: {
        apiEndpoint: "https://api.nft.storage/",
        uploadEndpoint: "https://api.nft.storage/upload"
      }
    }
  },
  
  // Cross-Chain Bridge Configuration
  bridges: {
    axelar: {
      apiEndpoint: "https://api.axelar.network/",
      supportedChains: ["ethereum", "polygon", "avalanche", "fantom", "moonbeam"]
    },
    layerZero: {
      supportedChains: [1, 56, 137, 43114, 42161, 10],
      endpoints: {
        ethereum: "0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675"
      }
    },
    wormhole: {
      supportedChains: ["ethereum", "solana", "polygon", "avalanche", "bnbchain"],
      coreContracts: {
        ethereum: "0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B"
      }
    }
  }
};
