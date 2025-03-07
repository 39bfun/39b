/**
 * LangChain-integrated Claude Service
 * Enhances AI prompt engineering and context management using the LangChain framework
 */

const { ChatAnthropic } = require('@langchain/anthropic');
const { PromptTemplate } = require('langchain/prompts');
const { StringOutputParser } = require('langchain/schema/output_parser');
const { RunnableSequence } = require('langchain/schema/runnable');
const { ChatPromptTemplate, HumanMessagePromptTemplate } = require('langchain/prompts');
const ClaudeService = require('./claude');

/**
 * LangChainClaudeService - LangChain-enhanced Claude Service
 * Extends the original ClaudeService to provide more powerful prompt templates and chain capabilities
 */
class LangChainClaudeService extends ClaudeService {
  /**
   * Initialize LangChain-enhanced Claude Service
   * @param {string} apiKey - Claude API key
   * @param {Object} options - Configuration options
   */
  constructor(apiKey, options = {}) {
    super(apiKey, options);
    
    // Initialize LangChain Claude model
    this.langchainModel = new ChatAnthropic({
      modelName: options.model || "claude-3-sonnet-20240229",
      anthropicApiKey: apiKey || process.env.CLAUDE_API_KEY,
      temperature: options.temperature || 0.7,
      maxTokens: options.maxTokens || 4000,
    });
    
    // Initialize prompt template collection
    this.promptTemplates = {
      contractGeneration: this.createContractGenerationChain(),
      frontendGeneration: this.createFrontendGenerationChain(),
      projectStructure: this.createProjectStructureChain(),
      readmeGeneration: this.createReadmeGenerationChain()
    };
  }
  
  /**
   * Create contract generation LangChain chain
   * @returns {RunnableSequence} - LangChain runnable sequence
   */
  createContractGenerationChain() {
    const template = PromptTemplate.fromTemplate(`
    You are a professional Web3 smart contract developer.
    Please generate secure and optimized smart contract code based on the following requirements:
    
    Blockchain: {blockchain}
    Contract Type: {contractType}
    Network: {network}
    Project Description: {description}
    
    Technical Requirements:
    {technicalDetails}
    
    Additional Requirements:
    {additionalRequirements}
    
    Please generate complete, deployable contract code with appropriate comments and error handling.
    {blockchainSpecificInstructions}
    `);
    
    return RunnableSequence.from([
      template,
      this.langchainModel,
      new StringOutputParser()
    ]);
  }
  
  /**
   * Create frontend generation LangChain chain
   * @returns {RunnableSequence} - LangChain runnable sequence
   */
  createFrontendGenerationChain() {
    const template = PromptTemplate.fromTemplate(`
    You are a professional Web3 frontend developer.
    Please generate responsive, user-friendly frontend components based on the following requirements:
    
    Blockchain: {blockchain}
    Project Type: {projectType}
    Framework: {framework}
    Project Description: {description}
    
    Technical Requirements:
    {technicalDetails}
    
    Blockchain Details:
    {blockchainDetails}
    
    Additional Requirements:
    {additionalRequirements}
    
    Please generate complete, usable frontend code with appropriate comments and error handling.
    Ensure the code follows modern Web3 development best practices.
    {blockchainSpecificInstructions}
    `);
    
    return RunnableSequence.from([
      template,
      this.langchainModel,
      new StringOutputParser()
    ]);
  }
  
  /**
   * Create project structure generation LangChain chain
   * @returns {RunnableSequence} - LangChain runnable sequence
   */
  createProjectStructureChain() {
    const template = PromptTemplate.fromTemplate(`
    You are a professional Web3 project architect.
    Please generate a complete project structure based on the following requirements:
    
    Blockchain: {blockchain}
    Project Type: {projectType}
    Project Description: {description}
    
    The generated structure should be in valid JSON format and include the following main sections:
    - contracts: Smart contract files
    - frontend: Frontend application code
    - scripts: Deployment and test scripts
    - Configuration files
    
    Please ensure the structure follows best practices and standard directory structure for the {blockchain} ecosystem.
    `);
    
    return RunnableSequence.from([
      template,
      this.langchainModel,
      new StringOutputParser()
    ]);
  }
  
  /**
   * Create README generation LangChain chain
   * @returns {RunnableSequence} - LangChain runnable sequence
   */
  createReadmeGenerationChain() {
    const template = PromptTemplate.fromTemplate(`
    You are a professional technical documentation writer.
    Please generate a comprehensive README.md file based on the following project information:
    
    Project Name: {projectName}
    Blockchain: {blockchain}
    Project Type: {projectType}
    Project Description: {description}
    
    The README should include:
    - Project Overview
    - Tech Stack
    - Installation Guide
    - Usage Instructions
    - Deployment Steps
    - Testing Methods
    - Key Features
    - License Information
    
    Please use Markdown format and ensure the documentation is clear, professional, and includes code examples and usage instructions.
    `);
    
    return RunnableSequence.from([
      template,
      this.langchainModel,
      new StringOutputParser()
    ]);
  }
  
  /**
   * Generate smart contract using LangChain
   * @param {string} description - Project description
   * @param {string} contractType - Contract type
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - Generated contract code
   */
  async generateContractWithLangChain(description, contractType, options = {}) {
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
    
    // Get network details
    const networkDetails = this.blockchainNetworks[blockchain] && 
                           this.blockchainNetworks[blockchain][network] 
      ? this.blockchainNetworks[blockchain][network] 
      : null;
    
    // Build technical details
    let technicalDetails = [];
    
    // Add standards information
    if (contractTypeDetails.standards && contractTypeDetails.standards.length > 0) {
      technicalDetails.push(`- Standards: ${contractTypeDetails.standards.join(', ')}`);
    }
    
    // Add interface information for Ethereum
    if (blockchain === 'ethereum' && contractTypeDetails.interfaces && contractTypeDetails.interfaces.length > 0) {
      technicalDetails.push(`- Interfaces: ${contractTypeDetails.interfaces.join(', ')}`);
    }
    
    // Add program information for Solana
    if (blockchain === 'solana' && contractTypeDetails.programs && contractTypeDetails.programs.length > 0) {
      technicalDetails.push(`- Programs: ${contractTypeDetails.programs.join(', ')}`);
    }
    
    // Add library/framework information
    if (contractTypeDetails.libraries && contractTypeDetails.libraries.length > 0) {
      technicalDetails.push(`- Libraries: ${contractTypeDetails.libraries.join(', ')}`);
    } else if (contractTypeDetails.frameworks && contractTypeDetails.frameworks.length > 0) {
      technicalDetails.push(`- Frameworks: ${contractTypeDetails.frameworks.join(', ')}`);
    }
    
    // Blockchain-specific instructions
    let blockchainSpecificInstructions = '';
    if (blockchain === 'ethereum') {
      blockchainSpecificInstructions = "Ensure the contract is optimized for gas and follows Ethereum security best practices, including reentrancy protection and proper access control.";
    } else if (blockchain === 'solana') {
      blockchainSpecificInstructions = "Ensure the program follows Solana's account model and security best practices.";
    }
    
    // Network details string
    let networkDetailsString = '';
    if (networkDetails) {
      networkDetailsString = `${networkDetails.name}`;
      
      if (blockchain === 'ethereum') {
        networkDetailsString += ` (Chain ID: ${networkDetails.chainId})`;
      }
    }
    
    // Call LangChain chain
    return await this.promptTemplates.contractGeneration.invoke({
      blockchain: blockchain,
      contractType: contractTypeDetails.name,
      network: networkDetailsString,
      description: description,
      technicalDetails: technicalDetails.join('\n'),
      additionalRequirements: options.additionalRequirements || '',
      blockchainSpecificInstructions: blockchainSpecificInstructions
    });
  }
  
  /**
   * Generate frontend code using LangChain
   * @param {string} description - Project description
   * @param {string} projectType - Project type
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - Generated frontend code
   */
  async generateFrontendWithLangChain(description, projectType, options = {}) {
    const blockchain = options.blockchain || this.config.defaultBlockchain;
    const framework = options.framework || 'react';
    
    // Validate blockchain and project type
    if (!this.projectTypes[blockchain]) {
      throw new Error(`Unsupported blockchain: ${blockchain}`);
    }
    
    if (!this.projectTypes[blockchain][projectType]) {
      throw new Error(`Unsupported project type '${projectType}' for blockchain '${blockchain}'`);
    }
    
    // Get project type details
    const projectTypeDetails = this.projectTypes[blockchain][projectType];
    
    // Get network details
    const networkDetails = this.blockchainNetworks[blockchain] && 
                           this.blockchainNetworks[blockchain][options.network || 'devnet'] 
      ? this.blockchainNetworks[blockchain][options.network || 'devnet'] 
      : null;
    
    // Build technical details
    let technicalDetails = [];
    
    // Add frontend library information
    if (projectTypeDetails.frontendLibraries && projectTypeDetails.frontendLibraries.length > 0) {
      technicalDetails.push(`- Frontend Libraries: ${projectTypeDetails.frontendLibraries.join(', ')}`);
    }
    
    // Add blockchain-specific wallet integration guide
    let blockchainDetails = [];
    if (blockchain === 'ethereum') {
      blockchainDetails = [
        '- Use ethers.js or web3.js for blockchain interaction',
        '- Integrate MetaMask or WalletConnect for wallet connection',
        '- Handle network switching and account changes',
        '- Implement proper error handling for transaction failures'
      ];
    } else if (blockchain === 'solana') {
      blockchainDetails = [
        '- Use @solana/web3.js for blockchain interaction',
        '- Integrate Phantom or Solflare wallet',
        '- Handle wallet connection and network selection',
        '- Implement proper error handling for transaction failures'
      ];
    }
    
    // Call LangChain chain
    return await this.promptTemplates.frontendGeneration.invoke({
      blockchain: blockchain,
      projectType: projectTypeDetails.name,
      framework: framework,
      description: description,
      technicalDetails: technicalDetails.join('\n'),
      blockchainDetails: blockchainDetails.join('\n'),
      additionalRequirements: options.additionalRequirements || '',
      blockchainSpecificInstructions: options.blockchainSpecificInstructions || ''
    });
  }
  
  /**
   * Generate project structure using LangChain
   * @param {string} description - Project description
   * @param {string} projectType - Project type
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Generated project structure
   */
  async generateProjectStructureWithLangChain(description, projectType, options = {}) {
    const blockchain = options.blockchain || this.config.defaultBlockchain;
    
    try {
      const result = await this.promptTemplates.projectStructure.invoke({
        blockchain: blockchain,
        projectType: projectType,
        description: description
      });
      
      // Parse string result to JSON object
      try {
        return JSON.parse(result);
      } catch (error) {
        console.warn('Failed to parse project structure JSON:', error);
        
        // Fallback to basic structure
        return {
          contracts: [],
          frontend: [],
          scripts: [],
          config: []
        };
      }
    } catch (error) {
      console.error('Failed to generate project structure:', error);
      throw error;
    }
  }
  
  /**
   * Generate project README using LangChain
   * @param {string} projectName - Project name
   * @param {string} description - Project description
   * @param {string} projectType - Project type
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - Generated README content
   */
  async generateReadmeWithLangChain(projectName, description, projectType, options = {}) {
    const blockchain = options.blockchain || this.config.defaultBlockchain;
    
    return await this.promptTemplates.readmeGeneration.invoke({
      projectName: projectName,
      blockchain: blockchain,
      projectType: projectType,
      description: description
    });
  }
  
  /**
   * Override original generateContract method to use LangChain enhanced version
   */
  async generateContract(description, contractType, options = {}) {
    return this.generateContractWithLangChain(description, contractType, options);
  }
  
  /**
   * Override original generateFrontend method to use LangChain enhanced version
   */
  async generateFrontend(description, projectType, options = {}) {
    return this.generateFrontendWithLangChain(description, projectType, options);
  }
  
  /**
   * Override original generateProjectStructure method to use LangChain enhanced version
   */
  async generateProjectStructure(description, projectType, options = {}) {
    return this.generateProjectStructureWithLangChain(description, projectType, options);
  }
}

module.exports = LangChainClaudeService;
