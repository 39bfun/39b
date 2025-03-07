import '../styles/globals.css';
import Head from 'next/head';

/**
 * 39b Application Component
 * Application entry file for global settings and styles
 */
function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="39b - AI-powered Web3 Project Development Framework" />
        <meta name="keywords" content="Web3, AI, Claude, Solana, Ethereum, Project Generator" />
        <title>39b - Web3 Project Development Framework</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
