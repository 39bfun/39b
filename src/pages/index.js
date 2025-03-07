import React, { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [projectSpec, setProjectSpec] = useState({
    name: '',
    description: '',
    type: 'token',
    blockchain: 'ethereum',
    params: {
      tokenName: '',
      tokenSymbol: '',
      network: 'devnet'
    }
  });
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generatedProject, setGeneratedProject] = useState(null);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested object changes (e.g., params.tokenName)
      const [parent, child] = name.split('.');
      setProjectSpec({
        ...projectSpec,
        [parent]: {
          ...projectSpec[parent],
          [child]: value
        }
      });
    } else {
      // Handle top-level changes
      setProjectSpec({
        ...projectSpec,
        [name]: value
      });
    }
  };
  
  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // This would be replaced with actual API call in production
      const response = await fetch('/api/generate-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectSpec),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate project');
      }
      
      const data = await response.json();
      setGeneratedProject(data);
      nextStep();
    } catch (error) {
      console.error('Error generating project:', error);
      alert('Failed to generate project: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="step-content">
            <h2>Project Concept</h2>
            <p>Describe the basic information of the Web3 project you want to create</p>
            
            <div className="form-group">
              <label htmlFor="name">Project Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={projectSpec.name}
                onChange={handleInputChange}
                className="form-control"
                placeholder="My Web3 Project"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Project Description</label>
              <textarea
                id="description"
                name="description"
                value={projectSpec.description}
                onChange={handleInputChange}
                className="form-control"
                placeholder="Describe your project features, goals and use cases in detail..."
                rows={5}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="blockchain">Blockchain Platform</label>
              <select
                id="blockchain"
                name="blockchain"
                value={projectSpec.blockchain}
                onChange={handleInputChange}
                className="form-control"
              >
                <option value="ethereum">Ethereum</option>
                <option value="solana">Solana</option>
              </select>
              <small className="form-text text-muted">
                Select the blockchain platform for project deployment
              </small>
            </div>
            
            <div className="form-group">
              <label htmlFor="type">Project Type</label>
              <select
                id="type"
                name="type"
                value={projectSpec.type}
                onChange={handleInputChange}
                className="form-control"
              >
                {projectSpec.blockchain === 'ethereum' ? (
                  <>
                    <option value="token">Token Project (ERC20)</option>
                    <option value="nft">NFT Project (ERC721)</option>
                    <option value="dapp">Ethereum DApp</option>
                  </>
                ) : (
                  <>
                    <option value="token">Token Project (SPL Token)</option>
                    <option value="nft">NFT Project (Metaplex)</option>
                    <option value="dapp">Solana DApp</option>
                  </>
                )}
              </select>
              <small className="form-text text-muted">
                Select project type based on chosen blockchain platform
              </small>
            </div>
            
            <div className="button-group">
              <button type="button" onClick={nextStep} className="btn btn-primary">
                Next
              </button>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="step-content">
            <h2>Technical Details</h2>
            <p>Configure technical parameters for your {projectSpec.blockchain === 'ethereum' ? 'Ethereum' : 'Solana'} project</p>
            
            <div className="blockchain-indicator">
              <strong>Blockchain Platform:</strong> {projectSpec.blockchain === 'ethereum' ? 'Ethereum' : 'Solana'}
            </div>
            
            {projectSpec.type === 'token' && (
              <>
                <div className="form-group">
                  <label htmlFor="params.tokenName">Token Name</label>
                  <input
                    type="text"
                    id="params.tokenName"
                    name="params.tokenName"
                    value={projectSpec.params.tokenName}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder={projectSpec.name || "My Token"}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="params.tokenSymbol">Token Symbol</label>
                  <input
                    type="text"
                    id="params.tokenSymbol"
                    name="params.tokenSymbol"
                    value={projectSpec.params.tokenSymbol}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder={projectSpec.name ? projectSpec.name.substring(0, 3).toUpperCase() : "MTK"}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="params.initialSupply">Initial Supply</label>
                  <input
                    type="number"
                    id="params.initialSupply"
                    name="params.initialSupply"
                    value={projectSpec.params.initialSupply || 1000000}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="1000000"
                  />
                </div>
              </>
            )}
            
            {projectSpec.type === 'nft' && (
              <>
                <div className="form-group">
                  <label htmlFor="params.collectionName">NFT Collection Name</label>
                  <input
                    type="text"
                    id="params.collectionName"
                    name="params.collectionName"
                    value={projectSpec.params.collectionName}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder={projectSpec.name || "My NFT Collection"}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="params.maxSupply">Maximum Supply</label>
                  <input
                    type="number"
                    id="params.maxSupply"
                    name="params.maxSupply"
                    value={projectSpec.params.maxSupply || 10000}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="10000"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="params.mintPrice">Mint Price ({projectSpec.blockchain === 'ethereum' ? 'ETH' : 'SOL'})</label>
                  <input
                    type="number"
                    id="params.mintPrice"
                    name="params.mintPrice"
                    value={projectSpec.params.mintPrice || 0.01}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="0.01"
                    step="0.001"
                  />
                </div>
              </>
            )}
            
            <div className="form-group">
              <label htmlFor="params.network">Network</label>
              <select
                id="params.network"
                name="params.network"
                value={projectSpec.params.network}
                onChange={handleInputChange}
                className="form-control"
              >
                <option value="mainnet">Mainnet</option>
                <option value="devnet">Devnet</option>
                <option value="testnet">Testnet</option>
              </select>
            </div>
            
            <div className="button-group">
              <button type="button" onClick={prevStep} className="btn btn-secondary">
                Previous
              </button>
              <button type="button" onClick={nextStep} className="btn btn-primary">
                Next
              </button>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="step-content">
            <h3>Project Overview</h3>
            <ul>
              <li><strong>Project Name:</strong> {projectSpec.name}</li>
              <li><strong>Blockchain Platform:</strong> {projectSpec.blockchain === 'ethereum' ? 'Ethereum' : 'Solana'}</li>
              <li><strong>Project Type:</strong> {
                projectSpec.type === 'token' ? 'Token Project' :
                projectSpec.type === 'nft' ? 'NFT Project' : 'DApp'
              }</li>
            </ul>
            
            <div className="button-group">
              <button type="button" onClick={prevStep} className="btn btn-secondary">
                Back
              </button>
              <button type="button" onClick={handleSubmit} className="btn btn-primary" disabled={loading}>
                {loading ? 'Generating...' : 'Generate Project'}
              </button>
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="step-content success">
            <h2>Project Generated Successfully!</h2>
            <p>Your Web3 project has been successfully generated. You can download the files or deploy directly to the test network</p>
            
            <div className="button-group">
              <a
                href={generatedProject?.downloadUrl}
                className="btn btn-primary"
                download
              >
                Download Project
              </a>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => window.location.reload()}
              >
                Create New Project
              </button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="container">
      <Head>
        <title>39b - Web3 Project Generator</title>
        <meta name="description" content="AI-powered Web3 project development framework" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main>
        <header className="text-center my-5">
          <h1 className="text-4xl font-bold">39b</h1>
          <p className="text-xl mt-2">AI-powered Web3 Project Development Framework</p>
        </header>
        
        <div className="project-generator">
          <div className="step-indicator">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Project Concept</div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Technical Details</div>
            <div className={`step ${step >= 3 ? 'active' : ''}`}>3. Confirm Information</div>
            <div className={`step ${step >= 4 ? 'active' : ''}`}>4. Generate Project</div>
          </div>
          
          <form className="generator-form">
            {renderStepContent()}
          </form>
        </div>
      </main>
      
      <footer className="text-center my-8 text-gray-600">
        <p>© 2025 39b - Web3 Project Development Framework</p>
      </footer>
      
      <style jsx>{`
        .container {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 1rem;
        }
        
        .step-indicator {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2rem;
          border-bottom: 1px solid #eaeaea;
          padding-bottom: 1rem;
        }
        
        .step {
          position: relative;
          color: #666;
          padding-bottom: 0.5rem;
        }
        
        .step.active {
          color: #0070f3;
          font-weight: bold;
        }
        
        .step.active:after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          width: 100%;
          height: 2px;
          background-color: #0070f3;
        }
        
        .generator-form {
          background-color: #f9f9f9;
          border-radius: 8px;
          padding: 2rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .form-group {
          margin-bottom: 1.5rem;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }
        
        .form-control {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }
        
        .button-group {
          display: flex;
          justify-content: space-between;
          margin-top: 2rem;
        }
        
        .btn {
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          border: none;
        }
        
        .btn-primary {
          background-color: #0070f3;
          color: white;
        }
        
        .btn-secondary {
          background-color: #f3f3f3;
          color: #333;
        }
        
        .btn-success {
          background-color: #10b981;
          color: white;
        }
        
        .project-summary {
          background-color: white;
          padding: 1.5rem;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .project-summary ul {
          list-style: none;
          padding: 0;
        }
        
        .project-summary li {
          padding: 0.5rem 0;
          border-bottom: 1px solid #eaeaea;
        }
        
        .project-result {
          background-color: white;
          padding: 1.5rem;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .download-options {
          margin-top: 1.5rem;
        }
        
        .ml-3 {
          margin-left: 1rem;
        }
        
        .mt-4 {
          margin-top: 1.5rem;
        }
      `}</style>
    </div>
  );
}
