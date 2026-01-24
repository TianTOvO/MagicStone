// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ToolNFT is ERC721, Ownable {
    struct Tool {
        uint8 level; // 0: 普通, 1: 专业, 2: 顶级, 3: 传奇
        uint256 durability;
        uint256 durabilityMax;
    }

    mapping(uint256 => Tool) public tools;
    uint256 public nextId;
    address public polishingContract;

    modifier onlyPolishing() {
        require(msg.sender == polishingContract, "Only polishing contract");
        _;
    }

    constructor() ERC721("PolishTool", "PTL") Ownable(msg.sender) {}

    function setPolishingContract(address _p) external onlyOwner {
        polishingContract = _p;
    }

    function mintTool(address to, uint8 level, uint256 durabilityMax) external onlyOwner returns (uint256) {
        nextId++;
        tools[nextId] = Tool(level, durabilityMax, durabilityMax);
        _safeMint(to, nextId);
        return nextId;
    }

    function getToolProps(uint256 id) external view returns (uint8, uint256, uint256) {
        Tool storage t = tools[id];
        return (t.level, t.durability, t.durabilityMax);
    }

    function decreaseDurability(uint256 id, uint256 value) external onlyPolishing {
        Tool storage t = tools[id];
        if (value >= t.durability) {
            t.durability = 0;
        } else {
            t.durability -= value;
        }
    }

    function setLevel(uint256 id, uint8 newLevel) external onlyPolishing {
        tools[id].level = newLevel;
        tools[id].durability = tools[id].durabilityMax;
    }

    function burn(uint256 id) external onlyOwner {
        _burn(id);
        delete tools[id];
    }
}
