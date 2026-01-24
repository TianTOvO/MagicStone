// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IERC721 {
    function ownerOf(uint256 tokenId) external view returns (address);
    function transferFrom(address from, address to, uint256 tokenId) external;
}

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

contract Market is Ownable {
    struct Listing {
        address seller;
        uint256 price;
        bool active;
    }

    IERC721 public stone;
    IERC721 public tool;
    IERC20 public token;

    mapping(bytes32 => Listing) public listings; // key = keccak(nft, tokenId)
    mapping(bytes32 => bool) public isStone; // true if stone listing

    event Listed(address indexed seller, bool isStone, uint256 tokenId, uint256 price);
    event Delisted(address indexed seller, bool isStone, uint256 tokenId);
    event Sold(address indexed buyer, address indexed seller, bool isStone, uint256 tokenId, uint256 price);

    constructor(address _stone, address _tool, address _token) Ownable(msg.sender) {
        stone = IERC721(_stone);
        tool = IERC721(_tool);
        token = IERC20(_token);
    }

    function list(bool _isStone, uint256 tokenId, uint256 price) external {
        IERC721 nft = _isStone ? stone : tool;
        require(nft.ownerOf(tokenId) == msg.sender, "Not owner");
        require(price > 0, "Invalid price");

        bytes32 key = keccak256(abi.encodePacked(_isStone, tokenId));
        listings[key] = Listing(msg.sender, price, true);
        isStone[key] = _isStone;

        emit Listed(msg.sender, _isStone, tokenId, price);
    }

    function delist(bool _isStone, uint256 tokenId) external {
        bytes32 key = keccak256(abi.encodePacked(_isStone, tokenId));
        Listing storage listing = listings[key];
        require(listing.seller == msg.sender, "Not seller");

        listing.active = false;
        emit Delisted(msg.sender, _isStone, tokenId);
    }

    function buy(bool _isStone, uint256 tokenId) external {
        bytes32 key = keccak256(abi.encodePacked(_isStone, tokenId));
        Listing storage listing = listings[key];
        require(listing.active, "Not listed");

        address seller = listing.seller;
        uint256 price = listing.price;
        listing.active = false;

        // Transfer token from buyer to seller
        require(token.transferFrom(msg.sender, seller, price), "Token transfer failed");

        // Transfer NFT from seller to buyer
        IERC721 nft = _isStone ? stone : tool;
        nft.transferFrom(seller, msg.sender, tokenId);

        emit Sold(msg.sender, seller, _isStone, tokenId, price);
    }
}
