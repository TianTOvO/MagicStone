import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ethers, BrowserProvider, Contract } from 'ethers';
import { getContractAddresses } from '../lib/contractAddresses';
import {
  STONE_NFT_ABI,
  TOOL_NFT_ABI,
  GAME_TOKEN_ABI,
  POLISHING_ABI,
  MARKET_ABI,
  QUEST_ABI,
} from '../lib/contractABIs';

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
  buyItem: (isStone: boolean, tokenId: number) => Promise<any>;
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

  const buyItem = useCallback(async (isStone: boolean, tokenId: number) => {
    if (!contracts.market) throw new Error('Contract not connected');
    return await (await contracts.market.buy(isStone, tokenId)).wait();
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
      polish, listItem, buyItem, getTokenBalance,
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
