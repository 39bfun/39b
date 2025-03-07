import React, { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';

const WalletConnector = () => {
  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState(null);
  const [network, setNetwork] = useState('devnet');
  
  const connectWallet = async () => {
    try {
      // Check if Phantom is installed
      const provider = window?.phantom?.solana;
      
      if (!provider?.isPhantom) {
        alert('Phantom wallet is not installed. Please install it from https://phantom.app/');
        return;
      }
      
      // Connect to wallet
      const response = await provider.connect();
      setWallet(response.publicKey.toString());
      
      // Get account balance
      const connection = new Connection(
        network === 'mainnet' ? 'https://api.mainnet-beta.solana.com' : 'https://api.devnet.solana.com',
        'confirmed'
      );
      
      const balance = await connection.getBalance(new PublicKey(response.publicKey.toString()));
      setBalance(balance / 1000000000); // Convert lamports to SOL
    } catch (error) {
      console.error('Error connecting to wallet:', error);
    }
  };
  
  const disconnectWallet = () => {
    window?.phantom?.solana?.disconnect();
    setWallet(null);
    setBalance(null);
  };
  
  return (
    <div className="wallet-connector">
      <h2>Wallet Connection</h2>
      
      <div className="network-selector">
        <label>
          Network:
          <select value={network} onChange={(e) => setNetwork(e.target.value)}>
            <option value="mainnet">Mainnet</option>
            <option value="devnet">Devnet</option>
          </select>
        </label>
      </div>
      
      {!wallet ? (
        <button onClick={connectWallet} className="connect-button">
          Connect Wallet
        </button>
      ) : (
        <div className="wallet-info">
          <p>
            <strong>Connected:</strong> {wallet.substring(0, 4)}...{wallet.substring(wallet.length - 4)}
          </p>
          <p>
            <strong>Balance:</strong> {balance !== null ? `${balance} SOL` : 'Loading...'}
          </p>
          <button onClick={disconnectWallet} className="disconnect-button">
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletConnector;