const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MagicStone Full Integration", function () {
  let stoneNFT, toolNFT, gameToken, polishing, market, quest;
  let owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy contracts
    const StoneNFT = await ethers.getContractFactory("StoneNFT");
    stoneNFT = await StoneNFT.deploy();
    await stoneNFT.waitForDeployment();

    const ToolNFT = await ethers.getContractFactory("ToolNFT");
    toolNFT = await ToolNFT.deploy();
    await toolNFT.waitForDeployment();

    const GameToken = await ethers.getContractFactory("GameToken");
    gameToken = await GameToken.deploy();
    await gameToken.waitForDeployment();

    const Polishing = await ethers.getContractFactory("Polishing");
    polishing = await Polishing.deploy(await stoneNFT.getAddress(), await toolNFT.getAddress());
    await polishing.waitForDeployment();

    const Market = await ethers.getContractFactory("Market");
    market = await Market.deploy(await stoneNFT.getAddress(), await toolNFT.getAddress(), await gameToken.getAddress());
    await market.waitForDeployment();

    const Quest = await ethers.getContractFactory("Quest");
    quest = await Quest.deploy(await gameToken.getAddress());
    await quest.waitForDeployment();

    // Set polishing contract in NFTs
    await stoneNFT.setPolishingContract(await polishing.getAddress());
    await toolNFT.setPolishingContract(await polishing.getAddress());
  });

  describe("Initial Setup", function () {
    it("Should deploy all contracts", async function () {
      expect(await stoneNFT.getAddress()).to.be.properAddress;
      expect(await toolNFT.getAddress()).to.be.properAddress;
      expect(await gameToken.getAddress()).to.be.properAddress;
      expect(await polishing.getAddress()).to.be.properAddress;
      expect(await market.getAddress()).to.be.properAddress;
      expect(await quest.getAddress()).to.be.properAddress;
    });
  });

  describe("Stone & Tool Minting", function () {
    it("Should mint stone with grade", async function () {
      const tx = await stoneNFT.mintStone(addr1.address, 0, 100, false);
      await tx.wait();
      
      const owner_stone = await stoneNFT.ownerOf(1);
      expect(owner_stone).to.equal(addr1.address);

      const [grade, damage, damageLimit, mysterious] = await stoneNFT.getStoneProps(1);
      expect(grade).to.equal(0);
      expect(damage).to.equal(0);
      expect(damageLimit).to.equal(100);
      expect(mysterious).to.equal(false);
    });

    it("Should mint tool with level", async function () {
      const tx = await toolNFT.mintTool(addr1.address, 0, 50);
      await tx.wait();
      
      const owner_tool = await toolNFT.ownerOf(1);
      expect(owner_tool).to.equal(addr1.address);

      const [level, durability, durabilityMax] = await toolNFT.getToolProps(1);
      expect(level).to.equal(0);
      expect(durability).to.equal(50);
      expect(durabilityMax).to.equal(50);
    });
  });

  describe("Polishing Mechanics", function () {
    beforeEach(async function () {
      // Mint stone and tool
      await stoneNFT.mintStone(addr1.address, 0, 100, false);
      await toolNFT.mintTool(addr1.address, 0, 50);
    });

    it("Should fail if not owner of stone", async function () {
      await expect(
        polishing.connect(addr2).polish(1, 1)
      ).to.be.revertedWith("Not stone owner");
    });

    it("Should perform polish and update states", async function () {
      await expect(polishing.connect(addr1).polish(1, 1))
        .to.emit(polishing, "Polished");

      const [grade1, damage1, damageLimit1] = await stoneNFT.getStoneProps(1);
      const [level1, durability1] = await toolNFT.getToolProps(1);

      // Damage should have increased
      expect(damage1).to.be.greaterThan(0);
      // Durability should have decreased
      expect(durability1).to.be.lessThan(50);
    });

    it("Should not polish if stone is fully damaged", async function () {
      // Create stone with very low damage limit
      await stoneNFT.mintStone(addr1.address, 0, 5, false);
      
      // Polish multiple times to reach limit
      for (let i = 0; i < 3; i++) {
        try {
          await polishing.connect(addr1).polish(2, 1);
        } catch (e) {
          // May fail due to tool durability or stone damage limit
        }
      }

      // Final check: damage should be at or near limit
      const [, damage2] = await stoneNFT.getStoneProps(2);
      expect(damage2).to.be.gte(5);
    });
  });

  describe("Market Trading", function () {
    beforeEach(async function () {
      // Mint and approve
      await stoneNFT.mintStone(addr1.address, 0, 100, false);
      await stoneNFT.connect(addr1).approve(await market.getAddress(), 1);
      
      // Mint tokens for buyer
      await gameToken.mint(addr2.address, 1000);
    });

    it("Should list stone for sale", async function () {
      await expect(market.connect(addr1).list(true, 1, 100))
        .to.emit(market, "Listed");
    });

    it("Should buy stone from market", async function () {
      await market.connect(addr1).list(true, 1, 100);
      await gameToken.connect(addr2).approve(await market.getAddress(), 100);
      
      await expect(market.connect(addr2).buy(true, 1))
        .to.emit(market, "Sold");

      const newOwner = await stoneNFT.ownerOf(1);
      expect(newOwner).to.equal(addr2.address);
    });

    it("Should delist stone from market", async function () {
      await market.connect(addr1).list(true, 1, 100);
      await expect(market.connect(addr1).delist(true, 1))
        .to.emit(market, "Delisted");
    });
  });

  describe("Quest System", function () {
    beforeEach(async function () {
      // Mint reward tokens
      await gameToken.mint(await quest.getAddress(), 10000);
    });

    it("Should create quest", async function () {
      await expect(quest.createQuest(0, "Test daily quest", 100))
        .to.emit(quest, "QuestCreated");

      const count = await quest.getQuestCount();
      expect(count).to.equal(1);
    });

    it("Should assign quest to user", async function () {
      await quest.createQuest(0, "Test daily quest", 100);
      await quest.assignQuestToUser(addr1.address, 0);

      // Note: no direct getter, but call should not revert
    });

    it("Should complete and claim reward", async function () {
      await quest.createQuest(0, "Test daily quest", 100);
      await quest.assignQuestToUser(addr1.address, 0);
      
      await quest.updateProgress(addr1.address, 0, 1);
      
      await expect(quest.connect(addr1).claimReward(0))
        .to.emit(quest, "RewardClaimed");

      const balance = await gameToken.balanceOf(addr1.address);
      expect(balance).to.equal(100);
    });
  });
});
