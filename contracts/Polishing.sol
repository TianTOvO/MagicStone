// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IStoneNFT {
    function ownerOf(uint256 tokenId) external view returns (address);
    function getStoneProps(uint256 id) external view returns (uint8, uint8, uint256, uint256, bool);
    function increaseDamage(uint256 id, uint256 value) external;
    function setGrade(uint256 id, uint8 newGrade) external;
    function setSubGrade(uint256 id, uint8 newSubGrade) external;
}

interface IToolNFT {
    function ownerOf(uint256 tokenId) external view returns (address);
    function getToolProps(uint256 id) external view returns (uint8, uint256, uint256);
    function decreaseDurability(uint256 id, uint256 value) external;
}

contract Polishing is Ownable {
    IStoneNFT public stone;
    IToolNFT public tool;

    event Polished(address indexed user, uint256 stoneId, uint256 toolId, bool upgraded, uint8 newGrade, uint8 newSubGrade);

    constructor(address _stone, address _tool) Ownable(msg.sender) {
        stone = IStoneNFT(_stone);
        tool = IToolNFT(_tool);
    }

    function setContracts(address _stone, address _tool) external onlyOwner {
        stone = IStoneNFT(_stone);
        tool = IToolNFT(_tool);
    }

    function polish(uint256 stoneId, uint256 toolId) external {
        require(stone.ownerOf(stoneId) == msg.sender, "Not stone owner");
        require(tool.ownerOf(toolId) == msg.sender, "Not tool owner");

        (uint8 grade, uint8 subGrade, uint256 damage, uint256 damageLimit, ) = stone.getStoneProps(stoneId);
        (uint8 level, uint256 durability, ) = tool.getToolProps(toolId);

        require(damage < damageLimit, "Stone not polishable");
        require(grade < 3, "Already max grade");
        require(durability > 0, "Tool has no durability");

        uint256 damageIncrease = 10 * (4 - uint256(level));
        if (damageIncrease == 0) damageIncrease = 1;

        uint256 durabilityLoss = 5 * (4 - uint256(level));
        if (durabilityLoss == 0) durabilityLoss = 1;

        stone.increaseDamage(stoneId, damageIncrease);
        tool.decreaseDurability(toolId, durabilityLoss);

        bool upgraded = _rollUpgrade(grade, level, stoneId, toolId);

        uint8 newGrade = grade;
        uint8 newSubGrade = subGrade;
        if (upgraded && grade < 3) {
            newGrade = grade + 1;
            stone.setGrade(stoneId, newGrade);
            // 子等级仅在升到 2 级或 3 级时分配
            if (newGrade >= 2) {
                newSubGrade = _rollSubGrade(newGrade, stoneId, toolId);
                stone.setSubGrade(stoneId, newSubGrade);
            }
        }

        emit Polished(msg.sender, stoneId, toolId, upgraded, newGrade, newSubGrade);
    }

    function _upgradeChance(uint8 grade, uint8 level) internal pure returns (uint256) {
        uint256 base;
        if (grade == 0) base = 50;
        else if (grade == 1) base = 30;
        else if (grade == 2) base = 15;
        else base = 5;

        uint256 chance = base + uint256(level) * 5;
        return chance > 95 ? 95 : chance;
    }

    function _rollUpgrade(uint8 grade, uint8 level, uint256 stoneId, uint256 toolId) internal view returns (bool) {
        uint256 chance = _upgradeChance(grade, level);
        uint256 rand = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, stoneId, toolId, block.prevrandao))) % 100;
        return rand < chance;
    }

    /// @notice 子等级概率（仅 2 级/3 级有效）：1=43% 2=30% 3=20% 4=7%
    function _rollSubGrade(uint8 newGrade, uint256 stoneId, uint256 toolId) internal view returns (uint8) {
        uint256 rand = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, stoneId, toolId, newGrade, block.prevrandao))) % 100;
        if (rand < 43) return 1;
        if (rand < 73) return 2;
        if (rand < 93) return 3;
        return 4;
    }
}
