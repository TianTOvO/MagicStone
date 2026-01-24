import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("MagicStoneModule", (m) => {
  // 部署 GameToken
  const gameToken = m.contract("GameToken");

  // 部署 StoneNFT
  const stoneNFT = m.contract("StoneNFT");

  // 部署 ToolNFT
  const toolNFT = m.contract("ToolNFT");

  // 部署 Polishing 合约
  const polishing = m.contract("Polishing", [stoneNFT, toolNFT]);

  // 部署 Market 合约
  const market = m.contract("Market", [stoneNFT, toolNFT, gameToken]);

  // 部署 Quest 合约
  const quest = m.contract("Quest", [gameToken]);

  // 设置 Polishing 合约地址到 NFT 合约
  m.call(stoneNFT, "setPolishingContract", [polishing]);
  m.call(toolNFT, "setPolishingContract", [polishing]);

  return {
    gameToken,
    stoneNFT,
    toolNFT,
    polishing,
    market,
    quest,
  };
});
