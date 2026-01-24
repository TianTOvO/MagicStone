import { useState, useCallback, useEffect } from 'react';
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

export function useContracts() {
  const [contracts, setContracts] = useState<ContractInstances>({
    stoneNFT: null,
    toolNFT: null,
    gameToken: null,
    polishing: null,
    market: null,
    quest: null,
    provider: null,
    signer: null,
  });

  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = useCallback(async () => {
    try {
      setError(null);
      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();

      const addresses = getContractAddresses();

      const stoneNFT = new Contract(addresses.stoneNFT, STONE_NFT_ABI, signer);
      const toolNFT = new Contract(addresses.toolNFT, TOOL_NFT_ABI, signer);
      const gameToken = new Contract(addresses.gameToken, GAME_TOKEN_ABI, signer);
      const polishing = new Contract(addresses.polishing, POLISHING_ABI, signer);
      const market = new Contract(addresses.market, MARKET_ABI, signer);
      const quest = new Contract(addresses.quest, QUEST_ABI, signer);

      setContracts({
        stoneNFT,
        toolNFT,
        gameToken,
        polishing,
        market,
        quest,
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
      stoneNFT: null,
      toolNFT: null,
      gameToken: null,
      polishing: null,
      market: null,
      quest: null,
      provider: null,
      signer: null,
    });
    setConnected(false);
    setAccount(null);
  }, []);

  // Stone NFT operations
  const getStoneProps = useCallback(
    async (stoneId: number) => {
      if (!contracts.stoneNFT) throw new Error('Contract not connected');
      return await contracts.stoneNFT.getStoneProps(stoneId);
    },
    [contracts.stoneNFT]
  );

  const setStonePolishingContract = useCallback(
    async (polishingAddress: string) => {
      if (!contracts.stoneNFT) throw new Error('Contract not connected');
      const tx = await contracts.stoneNFT.setPolishingContract(polishingAddress);
      return await tx.wait();
    },
    [contracts.stoneNFT]
  );

  // Tool NFT operations
  const getToolProps = useCallback(
    async (toolId: number) => {
      if (!contracts.toolNFT) throw new Error('Contract not connected');
      return await contracts.toolNFT.getToolProps(toolId);
    },
    [contracts.toolNFT]
  );

  const setToolPolishingContract = useCallback(
    async (polishingAddress: string) => {
      if (!contracts.toolNFT) throw new Error('Contract not connected');
      const tx = await contracts.toolNFT.setPolishingContract(polishingAddress);
      return await tx.wait();
    },
    [contracts.toolNFT]
  );

  // Polishing operation
  const polish = useCallback(
    async (stoneId: number, toolId: number) => {
      if (!contracts.polishing) throw new Error('Contract not connected');
      const tx = await contracts.polishing.polish(stoneId, toolId);
      return await tx.wait();
    },
    [contracts.polishing]
  );

  // Market operations
  const listItem = useCallback(
    async (isStone: boolean, tokenId: number, price: string) => {
      if (!contracts.market) throw new Error('Contract not connected');
      const tx = await contracts.market.list(isStone, tokenId, ethers.parseEther(price));
      return await tx.wait();
    },
    [contracts.market]
  );

  const buyItem = useCallback(
    async (isStone: boolean, tokenId: number) => {
      if (!contracts.market) throw new Error('Contract not connected');
      const tx = await contracts.market.buy(isStone, tokenId);
      return await tx.wait();
    },
    [contracts.market]
  );

  // GameToken operations
  const getTokenBalance = useCallback(
    async (address: string) => {
      if (!contracts.gameToken) throw new Error('Contract not connected');
      const balance = await contracts.gameToken.balanceOf(address);
      return ethers.formatEther(balance);
    },
    [contracts.gameToken]
  );

  // Approval operations
  const approveStone = useCallback(
    async (spender: string, tokenId: number) => {
      if (!contracts.stoneNFT) throw new Error('Contract not connected');
      const tx = await contracts.stoneNFT.approve(spender, tokenId);
      return await tx.wait();
    },
    [contracts.stoneNFT]
  );

  const approveTool = useCallback(
    async (spender: string, tokenId: number) => {
      if (!contracts.toolNFT) throw new Error('Contract not connected');
      const tx = await contracts.toolNFT.approve(spender, tokenId);
      return await tx.wait();
    },
    [contracts.toolNFT]
  );

  const approveToken = useCallback(
    async (spender: string, amount: string) => {
      if (!contracts.gameToken) throw new Error('Contract not connected');
      const tx = await contracts.gameToken.approve(spender, ethers.parseEther(amount));
      return await tx.wait();
    },
    [contracts.gameToken]
  );

  return {
    // State
    contracts,
    connected,
    account,
    error,

    // Connection
    connectWallet,
    disconnectWallet,

    // Stone operations
    getStoneProps,
    setStonePolishingContract,

    // Tool operations
    getToolProps,
    setToolPolishingContract,

    // Polishing
    polish,

    // Market
    listItem,
    buyItem,

    // Token
    getTokenBalance,

    // Approvals
    approveStone,
    approveTool,
    approveToken,
  };
}
