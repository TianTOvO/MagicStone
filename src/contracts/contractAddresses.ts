// Contract addresses for different networks
// For local development, these will be updated after deployment

export const CONTRACT_ADDRESSES = {
  localhost: {
    stoneNFT: "0x0000000000000000000000000000000000000000",
    toolNFT: "0x0000000000000000000000000000000000000000",
    gameToken: "0x0000000000000000000000000000000000000000",
    polishing: "0x0000000000000000000000000000000000000000",
    market: "0x0000000000000000000000000000000000000000",
    quest: "0x0000000000000000000000000000000000000000",
  },
  monad: {
    // Monad Test Network addresses (to be filled after deployment)
    stoneNFT: import.meta.env.VITE_STONE_NFT_ADDRESS || "0x0000000000000000000000000000000000000000",
    toolNFT: import.meta.env.VITE_TOOL_NFT_ADDRESS || "0x0000000000000000000000000000000000000000",
    gameToken: import.meta.env.VITE_GAME_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000",
    polishing: import.meta.env.VITE_POLISHING_ADDRESS || "0x0000000000000000000000000000000000000000",
    market: import.meta.env.VITE_MARKET_ADDRESS || "0x0000000000000000000000000000000000000000",
    quest: import.meta.env.VITE_QUEST_ADDRESS || "0x0000000000000000000000000000000000000000",
  },
};

export function getContractAddresses(chainId?: number) {
  // Default to localhost for development
  if (!chainId || chainId === 31337) {
    return CONTRACT_ADDRESSES.localhost;
  }
  return CONTRACT_ADDRESSES.monad;
}
