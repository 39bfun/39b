/**
 * API route for project generation
 * Handles project generation requests from the frontend
 */

import ProjectGenerator from '../../core/projectGenerator';
import ClaudeService from '../../core/claude';
import TemplateManager from '../../core/templateManager';
import path from 'path';

// Initialize services with configuration
const claudeService = new ClaudeService(process.env.CLAUDE_API_KEY, {
  defaultBlockchain: process.env.DEFAULT_BLOCKCHAIN || 'ethereum',
  maxRetries: 3
});

const templateManager = new TemplateManager();

const projectGenerator = new ProjectGenerator({
  claudeService,
  templateManager,
  outputDir: path.join(process.cwd(), 'output'),
  defaultBlockchain: process.env.DEFAULT_BLOCKCHAIN || 'ethereum'
});

// Ensure initialization on first API call
let initialized = false;

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Initialize project generator if not already initialized
    if (!initialized) {
      await projectGenerator.initialize();
      initialized = true;
    }
    
    const projectSpec = req.body;
    
    // Validate request body
    if (!projectSpec || !projectSpec.name || !projectSpec.description || !projectSpec.type) {
      return res.status(400).json({ error: 'Missing required project information' });
    }
    
    // Set default blockchain if not provided
    if (!projectSpec.blockchain) {
      projectSpec.blockchain = process.env.DEFAULT_BLOCKCHAIN || 'ethereum';
    }
    
    // Validate blockchain choice
    const supportedBlockchains = ['ethereum', 'solana'];
    if (!supportedBlockchains.includes(projectSpec.blockchain.toLowerCase())) {
      return res.status(400).json({ 
        error: 'Unsupported blockchain',
        message: `Blockchain '${projectSpec.blockchain}' is not supported. Supported options are: ${supportedBlockchains.join(', ')}`
      });
    }
    
    // Normalize blockchain value
    projectSpec.blockchain = projectSpec.blockchain.toLowerCase();
    
    // Generate project
    const projectDir = await projectGenerator.generateProject(projectSpec);
    
    // Return success response
    return res.status(200).json({
      success: true,
      projectName: projectSpec.name,
      projectPath: projectDir,
      projectType: projectSpec.type,
      blockchain: projectSpec.blockchain,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating project:', error);
    return res.status(500).json({
      error: 'Failed to generate project',
      message: error.message
    });
  }
}
