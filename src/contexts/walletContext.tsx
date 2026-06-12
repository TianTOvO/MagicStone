import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { ethers, BrowserProvider, Contract } from 'ethers';
import { getContractAddresses } from '../contracts/contractAddresses';
import {
  STONE_NFT_ABI,
  TOOL_NFT_ABI,
  GAME_TOKEN_ABI,
  POLISHING_ABI,
  MARKET_ABI,
  QUEST_ABI,
} from '../contracts/contractABIs';

export interface ContractInstances {
  stoneNFT: Contract | null;
  toolNFT: Contract | null;
  gameToken: Contract | null;
  polishing: Contract | null;
  market: Contract | null;
  quest: Contract | null;
  provider: BrowserProvider | null;
  signer: ethers.Signer | null;
}

interface WalletContextType {
  contracts: ContractInstances;
  connected: boolean;
  account: string | null;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  getStoneProps: (stoneId: number) => Promise<any>;
  setStonePolishingContract: (polishingAddress: string) => Promise<any>;
  getToolProps: (toolId: number) => Promise<any>;
  setToolPolishingContract: (polishingAddress: string) => Promise<any>;
  polish: (stoneId: number, toolId: number) => Promise<any>;
  listItem: (isStone: boolean, tokenId: number, price: string) => Promise<any>;
  delistItem: (isStone: boolean, tokenId: number) => Promise<any>;
  buyItem: (isStone: boolean, tokenId: number) => Promise<any>;
  makeOffer: (isStone: boolean, tokenId: number, price: string) => Promise<any>;
  cancelOffer: (isStone: boolean, tokenId: number) => Promise<any>;
  acceptOffer: (isStone: boolean, tokenId: number, buyer: string) => Promise<any>;
  getOffer: (isStone: boolean, tokenId: number) => Promise<{ buyer: string; price: bigint; active: boolean }>;
  getSaleHistory: (isStone: boolean, tokenId: number) => Promise<bigint[]>;
  startAuction: (isStone: boolean, tokenId: number, startPrice: string, minIncrement: string, duration: number) => Promise<any>;
  bid: (isStone: boolean, tokenId: number, bidAmount: string) => Promise<any>;
  settleAuction: (isStone: boolean, tokenId: number) => Promise<any>;
  cancelAuction: (isStone: boolean, tokenId: number) => Promise<any>;
  getAuction: (isStone: boolean, tokenId: number) => Promise<any>;
  getTokenBalance: (address: string) => Promise<string>;
  approveStone: (spender: string, tokenId: number) => Promise<any>;
  approveTool: (spender: string, tokenId: number) => Promise<any>;
  approveToken: (spender: string, amount: string) => Promise<any>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [contracts, setContracts] = useState<ContractInstances>({
    stoneNFT: null, toolNFT: null, gameToken: null,
    polishing: null, market: null, quest: null,
    provider: null, signer: null,
  });
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = useCallback(async () => {
    try {
      setError(null);
      if (!window.ethereum) throw new Error('MetaMask not installed');

      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const addresses = getContractAddresses();

      setContracts({
        stoneNFT: new Contract(addresses.stoneNFT, STONE_NFT_ABI, signer),
        toolNFT: new Contract(addresses.toolNFT, TOOL_NFT_ABI, signer),
        gameToken: new Contract(addresses.gameToken, GAME_TOKEN_ABI, signer),
        polishing: new Contract(addresses.polishing, POLISHING_ABI, signer),
        market: new Contract(addresses.market, MARKET_ABI, signer),
        quest: new Contract(addresses.quest, QUEST_ABI, signer),
        provider,
        signer,
      });
      setAccount(accounts[0]);
      setConnected(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(message);
      console.error('Connection error:', err);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setContracts({
      stoneNFT: null, toolNFT: null, gameToken: null,
      polishing: null, market: null, quest: null,
      provider: null, signer: null,
    });
    setConnected(false);
    setAccount(null);
  }, []);

  // Auto-reconnect on page load
  useEffect(() => {
    const tryReconnect = async () => {
      if (!window.ethereum) return;
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await connectWallet();
        }
      } catch {
        // User hasn't granted permission — do nothing
      }
    };
    tryReconnect();
  }, [connectWallet]);

  // Listen for account/network changes
  useEffect(() => {
    if (!window.ethereum) return;
    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        await connectWallet();
      }
    };
    const handleChainChanged = () => {
      // Reconnect on network change to refresh signer and contract addresses
      connectWallet();
    };
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [connectWallet, disconnectWallet]);

  const getStoneProps = useCallback(async (stoneId: number) => {
    if (!contracts.stoneNFT) throw new Error('Contract not connected');
    return await contracts.stoneNFT.getStoneProps(stoneId);
  }, [contracts.stoneNFT]);

  const setStonePolishingContract = useCallback(async (addr: string) => {
    if (!contracts.stoneNFT) throw new Error('Contract not connected');
    return await (await contracts.stoneNFT.setPolishingContract(addr)).wait();
  }, [contracts.stoneNFT]);

  const getToolProps = useCallback(async (toolId: number) => {
    if (!contracts.toolNFT) throw new Error('Contract not connected');
    return await contracts.toolNFT.getToolProps(toolId);
  }, [contracts.toolNFT]);

  const setToolPolishingContract = useCallback(async (addr: string) => {
    if (!contracts.toolNFT) throw new Error('Contract not connected');
    return await (await contracts.toolNFT.setPolishingContract(addr)).wait();
  }, [contracts.toolNFT]);

  const polish = useCallback(async (stoneId: number, toolId: number) => {
    if (!contracts.polishing) throw new Error('Contract not connected');
    return await (await contracts.polishing.polish(stoneId, toolId)).wait();
  }, [contracts.polishing]);

  const listItem = useCallback(async (isStone: boolean, tokenId: number, price: string) => {
    if (!contracts.market) throw new Error('Contract not connected');
    return await (await contracts.market.list(isStone, tokenId, ethers.parseEther(price))).wait();
  }, [contracts.market]);

  const delistItem = useCallback(async (isStone: boolean, tokenId: number) => {
    if (!contracts.market) throw new Error('Contract not connected');
    return await (await contracts.market.delist(isStone, tokenId)).wait();
  }, [contracts.market]);

  const makeOffer = useCallback(async (isStone: boolean, tokenId: number, price: string) => {
    if (!contracts.market) throw new Error('Contract not connected');
    return await (await contracts.market.makeOffer(isStone, tokenId, ethers.parseEther(price))).wait();
  }, [contracts.market]);

  const cancelOffer = useCallback(async (isStone: boolean, tokenId: number) => {
    if (!contracts.market) throw new Error('Contract not connected');
    return await (await contracts.market.cancelOffer(isStone, tokenId)).wait();
  }, [contracts.market]);

  const acceptOffer = useCallback(async (isStone: boolean, tokenId: number, buyer: string) => {
    if (!contracts.market) throw new Error('Contract not connected');
    return await (await contracts.market.acceptOffer(isStone, tokenId, buyer)).wait();
  }, [contracts.market]);

  const buyItem = useCallback(async (isStone: boolean, tokenId: number) => {
    if (!contracts.market) throw new Error('Contract not connected');
    return await (await contracts.market.buy(isStone, tokenId)).wait();
  }, [contracts.market]);

  const getOffer = useCallback(async (isStone: boolean, tokenId: number) => {
    if (!contracts.market) throw new Error('Contract not connected');
    return await contracts.market.getOffer(isStone, tokenId);
  }, [contracts.market]);

  const getSaleHistory = useCallback(async (isStone: boolean, tokenId: number) => {
    if (!contracts.market) throw new Error('Contract not connected');
    return await contracts.market.getSaleHistory(isStone, tokenId);
  }, [contracts.market]);

  const startAuction = useCallback(async (isStone: boolean, tokenId: number, startPrice: string, minIncrement: string, duration: number) => {
    if (!contracts.market) throw new Error('Contract not connected');
    return await (await contracts.market.startAuction(isStone, tokenId, ethers.parseEther(startPrice), ethers.parseEther(minIncrement), duration)).wait();
  }, [contracts.market]);

  const bid = useCallback(async (isStone: boolean, tokenId: number, bidAmount: string) => {
    if (!contracts.market) throw new Error('Contract not connected');
    return await (await contracts.market.bid(isStone, tokenId, ethers.parseEther(bidAmount))).wait();
  }, [contracts.market]);

  const settleAuction = useCallback(async (isStone: boolean, tokenId: number) => {
    if (!contracts.market) throw new Error('Contract not connected');
    return await (await contracts.market.settleAuction(isStone, tokenId)).wait();
  }, [contracts.market]);

  const cancelAuction = useCallback(async (isStone: boolean, tokenId: number) => {
    if (!contracts.market) throw new Error('Contract not connected');
    return await (await contracts.market.cancelAuction(isStone, tokenId)).wait();
  }, [contracts.market]);

  const getAuction = useCallback(async (isStone: boolean, tokenId: number) => {
    if (!contracts.market) throw new Error('Contract not connected');
    return await contracts.market.getAuction(isStone, tokenId);
  }, [contracts.market]);

  const getTokenBalance = useCallback(async (address: string) => {
    if (!contracts.gameToken) throw new Error('Contract not connected');
    const balance = await contracts.gameToken.balanceOf(address);
    return ethers.formatEther(balance);
  }, [contracts.gameToken]);

  const approveStone = useCallback(async (spender: string, tokenId: number) => {
    if (!contracts.stoneNFT) throw new Error('Contract not connected');
    return await (await contracts.stoneNFT.approve(spender, tokenId)).wait();
  }, [contracts.stoneNFT]);

  const approveTool = useCallback(async (spender: string, tokenId: number) => {
    if (!contracts.toolNFT) throw new Error('Contract not connected');
    return await (await contracts.toolNFT.approve(spender, tokenId)).wait();
  }, [contracts.toolNFT]);

  const approveToken = useCallback(async (spender: string, amount: string) => {
    if (!contracts.gameToken) throw new Error('Contract not connected');
    return await (await contracts.gameToken.approve(spender, ethers.parseEther(amount))).wait();
  }, [contracts.gameToken]);

  return (
    <WalletContext.Provider value={{
      contracts, connected, account, error,
      connectWallet, disconnectWallet,
      getStoneProps, setStonePolishingContract,
      getToolProps, setToolPolishingContract,
      polish, listItem, delistItem, buyItem, makeOffer, cancelOffer, acceptOffer,
      getOffer, getSaleHistory, startAuction, bid, settleAuction, cancelAuction, getAuction, getTokenBalance,
      approveStone, approveTool, approveToken,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useContracts(): WalletContextType {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useContracts must be used within WalletProvider');
  return ctx;
}
