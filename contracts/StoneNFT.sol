// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StoneNFT is ERC721, Ownable {
    struct Stone {
        uint8 grade; // 0: 平凡, 1: 奇特, 2: 珍稀, 3: 璀璨
        uint256 damage;
        uint256 damageLimit;
        bool mysterious;
    }

    mapping(uint256 => Stone) public stones;
    uint256 public nextId;
    address public polishingContract;

    modifier onlyPolishing() {
        require(msg.sender == polishingContract, "Only polishing contract");
        _;
    }

    constructor() ERC721("MagicStone", "MST") Ownable(msg.sender) {}

    function setPolishingContract(address _p) external onlyOwner {
        polishingContract = _p;
    }

    function mintStone(address to, uint8 grade, uint256 damageLimit, bool mysterious) external onlyOwner returns (uint256) {
        nextId++;
        stones[nextId] = Stone(grade, 0, damageLimit, mysterious);
        _safeMint(to, nextId);
        return nextId;
    }

    function getStoneProps(uint256 id) external view returns (uint8, uint256, uint256, bool) {
        Stone storage s = stones[id];
        return (s.grade, s.damage, s.damageLimit, s.mysterious);
    }

    function increaseDamage(uint256 id, uint256 value) external onlyPolishing {
        Stone storage s = stones[id];
        s.damage += value;
        if (s.damage > s.damageLimit) s.damage = s.damageLimit;
    }

    function setGrade(uint256 id, uint8 newGrade) external onlyPolishing {
        stones[id].grade = newGrade;
    }

    function burn(uint256 id) external onlyOwner {
        _burn(id);
        delete stones[id];
    }
}
