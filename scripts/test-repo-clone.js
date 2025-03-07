/**
 * Test GitHub Repository Clone Functionality
 * This script verifies that the repository cloning functionality in ProjectGenerator class works correctly
 */

const path = require('path');
const ProjectGenerator = require('../src/core/projectGenerator');

// Create test configuration
const testConfig = {
  outputDir: path.join(__dirname, '../test-output'),
  integrationsDir: path.join(__dirname, '../test-integrations'),
  useGptEngineer: false
};

console.log('====== Start Testing GitHub Repository Clone Functionality ======');

// Initialize project generator
const projectGenerator = new ProjectGenerator(testConfig);

// Check if Git is available
const gitAvailable = await projectGenerator.checkGitAvailable();
console.log(`Git available: ${gitAvailable}`);

if (!gitAvailable) {
  console.error('Error: Git not installed or unavailable, cannot continue testing');
  process.exit(1);
}

// List available repositories
console.log('\nAvailable GitHub repositories:');
Object.keys(projectGenerator.gitHubRepos).forEach(repoName => {
  console.log(`- ${repoName}`);
});

// Select repositories to clone for testing (choose smaller repos for testing)
const testRepos = ['langchain', 'gpt-engineer'];

console.log(`\nStarting to clone test repositories: ${testRepos.join(', ')}`);

// Mock a project specification
const projectSpec = {
  name: 'test-project',
  description: 'Test GitHub repository cloning functionality',
  type: 'dapp',
  blockchain: 'ethereum',
  reposToClone: testRepos,
  // Add necessary parameters to prevent tokenName undefined error
  params: {
    tokenName: 'TestToken',
    tokenSymbol: 'TST',
    initialSupply: '1000000',
    network: 'devnet'
  }
};

// Generate test project
const projectDir = await projectGenerator.generateProject(projectSpec);

console.log(`\nProject generation completed: ${projectDir}`);
console.log('Please check the following directories:');
console.log(`- Integration directory: ${testConfig.integrationsDir}`);
console.log(`- Project directory: ${projectDir}`);
console.log(`- Project integration references: ${path.join(projectDir, 'integrations')}`);

console.log('\n====== Test Completed ======');
