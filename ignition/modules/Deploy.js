async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy StoneNFT
  const StoneNFT = await ethers.getContractFactory("StoneNFT");
  const stoneNFT = await StoneNFT.deploy();
  await stoneNFT.deployed();
  console.log("StoneNFT deployed to:", stoneNFT.address);

  // Deploy ToolNFT
  const ToolNFT = await ethers.getContractFactory("ToolNFT");
  const toolNFT = await ToolNFT.deploy();
  await toolNFT.deployed();
  console.log("ToolNFT deployed to:", toolNFT.address);

  // Deploy GameToken
  const GameToken = await ethers.getContractFactory("GameToken");
  const gameToken = await GameToken.deploy();
  await gameToken.deployed();
  console.log("GameToken deployed to:", gameToken.address);

  // Deploy Polishing
  const Polishing = await ethers.getContractFactory("Polishing");
  const polishing = await Polishing.deploy(stoneNFT.address, toolNFT.address);
  await polishing.deployed();
  console.log("Polishing deployed to:", polishing.address);

  // Deploy Market
  const Market = await ethers.getContractFactory("Market");
  const market = await Market.deploy(stoneNFT.address, toolNFT.address, gameToken.address);
  await market.deployed();
  console.log("Market deployed to:", market.address);

  // Deploy Quest
  const Quest = await ethers.getContractFactory("Quest");
  const quest = await Quest.deploy(gameToken.address);
  await quest.deployed();
  console.log("Quest deployed to:", quest.address);

  // Set polishing contract in NFTs
  await stoneNFT.setPolishingContract(polishing.address);
  await toolNFT.setPolishingContract(polishing.address);
  console.log("Polishing contract set in NFTs");

  // Log summary
  console.log("\n=== Deployment Summary ===");
  console.log("StoneNFT:", stoneNFT.address);
  console.log("ToolNFT:", toolNFT.address);
  console.log("GameToken:", gameToken.address);
  console.log("Polishing:", polishing.address);
  console.log("Market:", market.address);
  console.log("Quest:", quest.address);

  // Initialize user with starter items (optional)
  const [, addr1] = await ethers.getSigners();
  if (addr1) {
    await stoneNFT.mintStone(addr1.address, 0, 100, false);
    await toolNFT.mintTool(addr1.address, 0, 50);
    await gameToken.mint(addr1.address, 1000);
    console.log("\nInitialized test user at:", addr1.address);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
