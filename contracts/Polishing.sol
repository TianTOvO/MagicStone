// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IStoneNFT {
    function ownerOf(uint256 tokenId) external view returns (address);
    function getStoneProps(uint256 id) external view returns (uint8, uint256, uint256, bool);
    function increaseDamage(uint256 id, uint256 value) external;
    function setGrade(uint256 id, uint8 newGrade) external;
}

interface IToolNFT {
    function ownerOf(uint256 tokenId) external view returns (address);
    function getToolProps(uint256 id) external view returns (uint8, uint256, uint256);
    function decreaseDurability(uint256 id, uint256 value) external;
}

contract Polishing is Ownable {
    IStoneNFT public stone;
    IToolNFT public tool;

    event Polished(address indexed user, uint256 stoneId, uint256 toolId, bool upgraded, uint8 newGrade);

    constructor(address _stone, address _tool) Ownable(msg.sender) {
        stone = IStoneNFT(_stone);
        tool = IToolNFT(_tool);
    }

    function setContracts(address _stone, address _tool) external onlyOwner {
        stone = IStoneNFT(_stone);
        tool = IToolNFT(_tool);
    }

    // Basic polish flow: checks ownership, damage/durability, computes changes, executes random upgrade
    function polish(uint256 stoneId, uint256 toolId) external {
        require(stone.ownerOf(stoneId) == msg.sender, "Not stone owner");
        require(tool.ownerOf(toolId) == msg.sender, "Not tool owner");

        (uint8 grade, uint256 damage, uint256 damageLimit, ) = stone.getStoneProps(stoneId);
        (uint8 level, uint256 durability, ) = tool.getToolProps(toolId);

        require(damage < damageLimit, "Stone not polishable");
        require(durability > 0, "Tool has no durability");

        // Simple formulas (tweakable): higher tool level reduces damage increase and durability loss
        uint256 baseDamage = 10;
        uint256 damageIncrease = baseDamage * (4 - uint256(level)); // level 0 -> *4, level3 -> *1
        if (damageIncrease == 0) damageIncrease = 1;

        uint256 baseDurLoss = 5;
        uint256 durabilityLoss = baseDurLoss * (4 - uint256(level));
        if (durabilityLoss == 0) durabilityLoss = 1;

        // Success chance: base by grade (0:50,1:30,2:15,3:5) adjusted by tool level (+5% per tool level)
        uint256 baseChance;
        if (grade == 0) baseChance = 50;
        else if (grade == 1) baseChance = 30;
        else if (grade == 2) baseChance = 15;
        else baseChance = 5;

        uint256 chance = baseChance + uint256(level) * 5;
        if (chance > 95) chance = 95;

        // Pseudo-random (placeholder for VRF)
        uint256 rand = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, stoneId, toolId, block.prevrandao))) % 100;
        bool upgraded = rand < chance;

        // update states via NFT contracts
        stone.increaseDamage(stoneId, damageIncrease);
        tool.decreaseDurability(toolId, durabilityLoss);

        uint8 newGrade = grade;
        if (upgraded) {
            if (newGrade < 3) newGrade = newGrade + 1;
            stone.setGrade(stoneId, newGrade);
        }

        emit Polished(msg.sender, stoneId, toolId, upgraded, newGrade);
    }
}
