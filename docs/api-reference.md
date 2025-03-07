# API Reference

This document provides detailed API reference for the 39B framework.

## Table of Contents

- [Web3ProjectManager](#web3projectmanager)
- [ClaudeService](#claudeservice)
- [TemplateManager](#templatemanager)
- [BlockchainEnhancer](#blockchainenhancer)

## Web3ProjectManager

`Web3ProjectManager` is the core class for generating and managing Web3 projects.

### Constructor

```javascript
const projectManager = new Web3ProjectManager(options);
```

**Parameters**:
- `options` (Object): Configuration options
  - `apiKey` (String): Claude API key
  - `outputDir` (String): Output directory
  - `defaultBlockchain` (String): Default blockchain
  - `useGptEngineer` (Boolean): Whether to use GPT-Engineer
  - `multiChainSupport` (Boolean): Whether to support multiple chains

### Methods

#### initialize()

Initialize the project manager.

```javascript
await projectManager.initialize();
```

#### generateProject(name, description, options)

Generate a new project.

```javascript
const result = await projectManager.generateProject(name, description, options);
```

**Parameters**:
- `name` (String): Project name
- `description` (String): Project description
- `options` (Object): Project options
  - `blockchain` (String): Blockchain platform
  - `projectType` (String): Project type
  - `testFramework` (String): Test framework
  - `additionalBlockchains` (Array): Additional blockchain platforms

**Returns**:
- `result` (Object): Generation result
  - `success` (Boolean): Whether successful
  - `outputDir` (String): Output directory
  - `error` (String): Error message (if any)

#### addMultiChainSupport(projectDir, primaryChain, additionalChains)

Add multi-chain support to an existing project.

```javascript
await projectManager.addMultiChainSupport(projectDir, primaryChain, additionalChains);
```

**Parameters**:
- `projectDir` (String): Project directory
- `primaryChain` (String): Primary blockchain
- `additionalChains` (Array): Additional blockchain platforms

## ClaudeService

`ClaudeService` provides functionality for interacting with the Claude API.

### Constructor

```javascript
const claudeService = new ClaudeService(config);
```

**Parameters**:
- `config` (Object): Configuration options
  - `apiKey` (String): Claude API key
  - `model` (String): Model name
  - `maxTokens` (Number): Maximum number of tokens
  - `temperature` (Number): Temperature

### Methods

#### callClaudeAPI(prompt, options)

Call the Claude API.

```javascript
const response = await claudeService.callClaudeAPI(prompt, options);
```

**Parameters**:
- `prompt` (String): Prompt text
- `options` (Object): Call options
  - `maxTokens` (Number): Maximum number of tokens
  - `temperature` (Number): Temperature

**Returns**:
- `response` (Object): API response

#### enhancedCallClaudeAPI(input, options)

Enhanced Claude API call with support for various advanced features.

```javascript
const response = await claudeService.enhancedCallClaudeAPI(input, options);
```

**Parameters**:
- `input` (String|Object): Prompt text or multi-modal input object
- `options` (Object): Call options
  - `maxTokens` (Number): Maximum number of tokens
  - `temperature` (Number): Temperature
  - `model` (String): Model name
  - `systemPrompt` (String): System prompt
  - `streamResponse` (Boolean): Whether to stream response
  - `validateResponse` (Boolean): Whether to validate response
  - `multiModal` (Boolean): Whether multi-modal input
  - `extractCode` (Boolean): Whether to extract code
  - `blockchainContext` (String): Blockchain context

**Returns**:
- `response` (Object): Enhanced response
  - `text` (String): Response text
  - `metadata` (Object): Metadata
  - `code` (String): Extracted code
  - `validation` (Object): Validation result

## TemplateManager

`TemplateManager` manages project templates.

### Constructor

```javascript
const templateManager = new TemplateManager(options);
```

**Parameters**:
- `options` (Object): Configuration options
  - `templatesDir` (String): Templates directory

### Methods

#### getTemplate(blockchain, projectType)

Get the template for the specified blockchain and project type.

```javascript
const template = templateManager.getTemplate(blockchain, projectType);
```

**Parameters**:
- `blockchain` (String): Blockchain platform
- `projectType` (String): Project type

**Returns**:
- `template` (Object): Template object

#### listTemplates()

List all available templates.

```javascript
const templates = templateManager.listTemplates();
```

**Returns**:
- `templates` (Array): Template list

## BlockchainEnhancer

`BlockchainEnhancer` provides blockchain-specific enhancements.

### Constructor

```javascript
const enhancer = new BlockchainEnhancer(options);
```

**Parameters**:
- `options` (Object): Configuration options
  - `blockchain` (String): Blockchain platform

### Methods

#### enhanceContract(contractCode, options)

Enhance smart contract code.

```javascript
const enhancedCode = enhancer.enhanceContract(contractCode, options);
```

**Parameters**:
- `contractCode` (String): Contract code
- `options` (Object): Enhancement options
  - `optimizationLevel` (Number): Optimization level
  - `securityChecks` (Boolean): Whether to perform security checks

**Returns**:
- `enhancedCode` (String): Enhanced code

#### generateCrossChainCode(sourceChain, targetChains)

Generate cross-chain code.

```javascript
const crossChainCode = enhancer.generateCrossChainCode(sourceChain, targetChains);
```

**Parameters**:
- `sourceChain` (String): Source blockchain
- `targetChains` (Array): Target blockchains

**Returns**:
- `crossChainCode` (Object): Cross-chain code
