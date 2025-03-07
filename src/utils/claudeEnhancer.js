/**
 * Claude Service Enhancer
 * Integrates BlockchainEnhancer tools with Claude service to enhance blockchain-specific functionality
 */

const BlockchainEnhancer = require('./blockchainEnhancer');

/**
 * Claude Service Enhancer Class
 * Extends Claude service with blockchain-specific functionality
 */
class ClaudeEnhancer {
  /**
   * Initialize Claude Service Enhancer
   * @param {Object} claudeService - Claude service instance
   * @param {Object} options - Configuration options
   */
  constructor(claudeService, options = {}) {
    this.claudeService = claudeService;
    this.blockchainEnhancer = new BlockchainEnhancer(options);
    
    // Save original method references so we can enhance them
    this.originalGenerateContract = claudeService.generateContract.bind(claudeService);
    this.originalGenerateFrontend = claudeService.generateFrontend.bind(claudeService);
    this.originalGenerateProjectStructure = claudeService.generateProjectStructure.bind(claudeService);
    
    // Enhance Claude service methods
    this.enhanceClaudeService();
  }
  
  /**
   * Enhance Claude service methods
   * Replace original methods with enhanced ones
   */
  enhanceClaudeService() {
    // Enhance smart contract generation method
    this.claudeService.generateContract = this.enhancedGenerateContract.bind(this);
    
    // Enhance frontend generation method
    this.claudeService.generateFrontend = this.enhancedGenerateFrontend.bind(this);
    
    // Enhance project structure generation method
    this.claudeService.generateProjectStructure = this.enhancedGenerateProjectStructure.bind(this);
    
    // Add new methods
    this.claudeService.generateWithGptEngineer = this.generateWithGptEngineer.bind(this);
    this.claudeService.getBlockchainDesignPatterns = this.getBlockchainDesignPatterns.bind(this);
    this.claudeService.getBlockchainErrorPatterns = this.getBlockchainErrorPatterns.bind(this);
  }
  
  /**
   * Enhanced smart contract generation method
   * @param {string} description - Project description
   * @param {string} contractType - Contract type (token, nft, dapp)
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - Generated contract code
   */
  async enhancedGenerateContract(description, contractType, options = {}) {
    const blockchain = options.blockchain || this.claudeService.config.defaultBlockchain;
    
    // Use original method to generate prompt
    let prompt = '';
    
    // Select appropriate prompt template
    if (this.claudeService.blockchainTemplates[blockchain] && this.claudeService.blockchainTemplates[blockchain].contractGeneration) {
      prompt = this.claudeService.blockchainTemplates[blockchain].contractGeneration;
    } else {
      prompt = this.claudeService.templates.contractGeneration;
    }
    
    // Add contract type details
    const contractTypeDetails = this.claudeService.contractTypes[blockchain][contractType];
    
    prompt += `Contract Type: ${contractTypeDetails.name}\n`;
    prompt += `Blockchain: ${blockchain}\n`;
    prompt += `Project Description: ${description}\n\n`;
    
    // Use BlockchainEnhancer to enhance prompt
    const enhancedPrompt = this.blockchainEnhancer.enhanceContractPrompt(
      prompt,
      blockchain,
      contractType
    );
    
    // Call original method with enhanced prompt
    options.enhancedPrompt = enhancedPrompt;
    return this.originalGenerateContract(description, contractType, options);
  }
  
  /**
   * Enhanced frontend generation method
   * @param {string} description - Project description
   * @param {string} projectType - Project type (token, nft, dapp)
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - Generated frontend code
   */
  async enhancedGenerateFrontend(description, projectType, options = {}) {
    // Call original method, but can add additional enhancements here
    return this.originalGenerateFrontend(description, projectType, options);
  }
  
  /**
   * Enhanced project structure generation method
   * @param {string} description - Project description
   * @param {Object} options - Additional options
   * @returns {Promise<object>} - Generated project structure
   */
  async enhancedGenerateProjectStructure(description, options = {}) {
    // Call original method, but can add additional enhancements here
    return this.originalGenerateProjectStructure(description, options);
  }
  
  /**
   * Generate code using gpt-engineer
   * @param {string} description - Project description
   * @param {string} outputDir - Output directory
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - Generation result
   */
  async generateWithGptEngineer(description, outputDir, options = {}) {
    return this.blockchainEnhancer.generateWithGptEngineer(
      description,
      outputDir,
      options
    );
  }
  
  /**
   * Get blockchain-specific design patterns
   * @param {string} blockchain - Blockchain type (ethereum, solana)
   * @param {string} patternType - Pattern type (security, optimization)
   * @returns {Array} - List of design patterns
   */
  getBlockchainDesignPatterns(blockchain, patternType) {
    return this.blockchainEnhancer.getDesignPatterns(blockchain, patternType);
  }
  
  /**
   * Get blockchain-specific error handling patterns
   * @param {string} blockchain - Blockchain type (ethereum, solana)
   * @returns {Array} - List of error handling patterns
   */
  getBlockchainErrorPatterns(blockchain) {
    return this.blockchainEnhancer.getErrorHandlingPatterns(blockchain);
  }
}

module.exports = ClaudeEnhancer;
