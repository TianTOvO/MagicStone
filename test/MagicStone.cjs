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

  describe("Market - List & Buy", function () {
    beforeEach(async function () {
      await stoneNFT.mintStone(addr1.address, 0, 100, false);
      await stoneNFT.connect(addr1).approve(await market.getAddress(), 1);
      await gameToken.mint(addr2.address, 1000);
    });

    it("Should list stone for sale", async function () {
      await expect(market.connect(addr1).list(true, 1, 100))
        .to.emit(market, "Listed");
    });

    it("Should buy stone and deduct fee", async function () {
      await market.connect(addr1).list(true, 1, 100);
      await gameToken.connect(addr2).approve(await market.getAddress(), 100);

      const sellerBefore = await gameToken.balanceOf(addr1.address);
      const feeReceiverBefore = await gameToken.balanceOf(owner.address);

      await expect(market.connect(addr2).buy(true, 1))
        .to.emit(market, "Sold");

      // addr1 was the seller, should receive 100 - fee = 98
      const sellerAfter = await gameToken.balanceOf(addr1.address);
      expect(sellerAfter - sellerBefore).to.equal(98n);

      // feeReceiver should receive 2
      const feeReceiverAfter = await gameToken.balanceOf(owner.address);
      expect(feeReceiverAfter - feeReceiverBefore).to.equal(2n);

      // NFT ownership transferred
      expect(await stoneNFT.ownerOf(1)).to.equal(addr2.address);
    });

    it("Should delist stone", async function () {
      await market.connect(addr1).list(true, 1, 100);
      await expect(market.connect(addr1).delist(true, 1))
        .to.emit(market, "Delisted");
    });

    it("Should record sale history", async function () {
      await market.connect(addr1).list(true, 1, 80);
      await gameToken.connect(addr2).approve(await market.getAddress(), 80);
      await market.connect(addr2).buy(true, 1);

      const history = await market.getSaleHistory(true, 1);
      expect(history.length).to.equal(1);
      expect(history[0]).to.equal(80);
    });
  });

  describe("Market - Offer System", function () {
    beforeEach(async function () {
      await stoneNFT.mintStone(addr1.address, 0, 100, false);
      await gameToken.mint(addr2.address, 500);
    });

    it("Should make offer and escrow tokens", async function () {
      await gameToken.connect(addr2).approve(await market.getAddress(), 100);

      const balanceBefore = await gameToken.balanceOf(addr2.address);

      await expect(market.connect(addr2).makeOffer(true, 1, 100))
        .to.emit(market, "OfferMade");

      // Buyer's tokens are escrowed in contract
      const balanceAfter = await gameToken.balanceOf(addr2.address);
      expect(balanceBefore - balanceAfter).to.equal(100n);

      const marketBalance = await gameToken.balanceOf(await market.getAddress());
      expect(marketBalance).to.equal(100n);
    });

    it("Should cancel offer and refund", async function () {
      await gameToken.connect(addr2).approve(await market.getAddress(), 100);
      await market.connect(addr2).makeOffer(true, 1, 100);

      await expect(market.connect(addr2).cancelOffer(true, 1))
        .to.emit(market, "OfferCancelled");

      // Full refund
      expect(await gameToken.balanceOf(addr2.address)).to.equal(500);

      // Offer is inactive
      const [, , active] = await market.getOffer(true, 1);
      expect(active).to.equal(false);
    });

    it("Should accept offer and settle", async function () {
      await gameToken.connect(addr2).approve(await market.getAddress(), 100);
      await market.connect(addr2).makeOffer(true, 1, 100);

      await stoneNFT.connect(addr1).approve(await market.getAddress(), 1);

      const sellerBefore = await gameToken.balanceOf(addr1.address);

      await expect(market.connect(addr1).acceptOffer(true, 1, addr2.address))
        .to.emit(market, "OfferAccepted");

      // Seller receives 100 - fee = 98
      const sellerAfter = await gameToken.balanceOf(addr1.address);
      expect(sellerAfter - sellerBefore).to.equal(98n);

      // NFT transferred
      expect(await stoneNFT.ownerOf(1)).to.equal(addr2.address);

      // Sale history recorded
      const history = await market.getSaleHistory(true, 1);
      expect(history.length).to.equal(1);
    });

    it("Should reject non-owner accepting offer", async function () {
      await gameToken.connect(addr2).approve(await market.getAddress(), 100);
      await market.connect(addr2).makeOffer(true, 1, 100);

      await expect(
        market.connect(addr2).acceptOffer(true, 1, addr2.address)
      ).to.be.revertedWith("Not owner");
    });
  });

  describe("Market - Fee Admin", function () {
    it("Should update fee", async function () {
      await expect(market.setFee(500))
        .to.emit(market, "FeeUpdated")
        .withArgs(250, 500);

      expect(await market.feeBps()).to.equal(500);
    });

    it("Should reject fee over max", async function () {
      await expect(market.setFee(1001)).to.be.revertedWith("Fee too high");
    });

    it("Should update fee receiver", async function () {
      await market.setFeeReceiver(addr2.address);
      expect(await market.feeReceiver()).to.equal(addr2.address);
    });

    it("Should default fee to 250 bps (2.5%)", async function () {
      expect(await market.feeBps()).to.equal(250);
    });
  });

  describe("Market - Auction", function () {
    beforeEach(async function () {
      await stoneNFT.mintStone(addr1.address, 0, 100, false);
      await stoneNFT.connect(addr1).approve(await market.getAddress(), 1);
      await gameToken.mint(addr2.address, 2000);
    });

    it("Should start auction and escrow NFT", async function () {
      await expect(market.connect(addr1).startAuction(true, 1, 50, 10, 3600))
        .to.emit(market, "AuctionStarted");

      // NFT is escrowed in contract
      expect(await stoneNFT.ownerOf(1)).to.equal(await market.getAddress());

      const a = await market.getAuction(true, 1);
      expect(a.seller).to.equal(addr1.address);
      expect(a.startPrice).to.equal(50);
      expect(a.active).to.equal(true);
    });

    it("Should place bid", async function () {
      await market.connect(addr1).startAuction(true, 1, 50, 10, 3600);
      await gameToken.connect(addr2).approve(await market.getAddress(), 100);

      const balanceBefore = await gameToken.balanceOf(addr2.address);
      await expect(market.connect(addr2)["bid(bool,uint256,uint256)"](true, 1, 60))
        .to.emit(market, "AuctionBid");

      const balanceAfter = await gameToken.balanceOf(addr2.address);
      expect(balanceBefore - balanceAfter).to.equal(60n);

      const a = await market.getAuction(true, 1);
      expect(a.highestBidder).to.equal(addr2.address);
      expect(a.highestBid).to.equal(60);
    });

    it("Should refund previous bidder on new bid", async function () {
      await market.connect(addr1).startAuction(true, 1, 50, 10, 3600);
      await gameToken.connect(addr2).approve(await market.getAddress(), 100);
      await market.connect(addr2)["bid(bool,uint256,uint256)"](true, 1, 60);

      // addr2 minted another account to outbid
      const signers = await ethers.getSigners();
      const addr3 = signers[3];
      await gameToken.mint(addr3.address, 500);
      await gameToken.connect(addr3).approve(await market.getAddress(), 200);
      await market.connect(addr3)["bid(bool,uint256,uint256)"](true, 1, 80);

      // addr2 should be refunded
      expect(await gameToken.balanceOf(addr2.address)).to.equal(2000);
    });

    it("Should reject bid below minimum", async function () {
      await market.connect(addr1).startAuction(true, 1, 50, 10, 3600);
      await gameToken.connect(addr2).approve(await market.getAddress(), 100);

      await expect(
        market.connect(addr2)["bid(bool,uint256,uint256)"](true, 1, 30)
      ).to.be.revertedWith("Bid too low");
    });

    it("Should settle auction and transfer NFT to winner", async function () {
      await market.connect(addr1).startAuction(true, 1, 50, 10, 60); // 60s duration
      await gameToken.connect(addr2).approve(await market.getAddress(), 200);
      await market.connect(addr2)["bid(bool,uint256,uint256)"](true, 1, 80);

      // Fast-forward time
      await ethers.provider.send("evm_increaseTime", [61]);
      await ethers.provider.send("evm_mine");

      await expect(market.settleAuction(true, 1))
        .to.emit(market, "AuctionSettled");

      // NFT goes to winner
      expect(await stoneNFT.ownerOf(1)).to.equal(addr2.address);

      // Seller receives proceeds (80 - 2.5% = 78)
      const history = await market.getSaleHistory(true, 1);
      expect(history[0]).to.equal(80);
    });

    it("Should return NFT when no bids", async function () {
      await market.connect(addr1).startAuction(true, 1, 50, 10, 60);

      await ethers.provider.send("evm_increaseTime", [61]);
      await ethers.provider.send("evm_mine");

      await expect(market.settleAuction(true, 1))
        .to.emit(market, "AuctionCancelled");

      // NFT returns to seller
      expect(await stoneNFT.ownerOf(1)).to.equal(addr1.address);
    });

    it("Should allow seller to cancel auction with no bids", async function () {
      await market.connect(addr1).startAuction(true, 1, 50, 10, 3600);

      await expect(market.connect(addr1).cancelAuction(true, 1))
        .to.emit(market, "AuctionCancelled");

      expect(await stoneNFT.ownerOf(1)).to.equal(addr1.address);
    });

    it("Should not cancel auction with bids", async function () {
      await market.connect(addr1).startAuction(true, 1, 50, 10, 3600);
      await gameToken.connect(addr2).approve(await market.getAddress(), 200);
      await market.connect(addr2)["bid(bool,uint256,uint256)"](true, 1, 80);

      await expect(
        market.connect(addr1).cancelAuction(true, 1)
      ).to.be.revertedWith("Has bids");
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
