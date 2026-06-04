// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Market is Ownable {
    uint256 public constant MAX_FEE_BPS = 1000; // 10%

    struct Listing {
        address seller;
        uint256 price;
        bool active;
    }

    struct Offer {
        address buyer;
        uint256 price;
        bool active;
    }

    IERC721 public stone;
    IERC721 public tool;
    IERC20 public token;

    uint256 public feeBps; // 250 = 2.5%
    address public feeReceiver;

    mapping(bytes32 => Listing) public listings;
    mapping(bytes32 => bool) public isStone;
    mapping(bytes32 => Offer) public offers;
    mapping(bytes32 => uint256[]) public saleHistory; // last 10 sale prices per NFT

    event Listed(address indexed seller, bool isStone, uint256 indexed tokenId, uint256 price);
    event Delisted(address indexed seller, bool isStone, uint256 indexed tokenId);
    event Sold(address indexed buyer, address indexed seller, bool isStone, uint256 indexed tokenId, uint256 price, uint256 fee);
    event OfferMade(address indexed buyer, bool isStone, uint256 indexed tokenId, uint256 price);
    event OfferCancelled(address indexed buyer, bool isStone, uint256 indexed tokenId);
    event OfferAccepted(address indexed buyer, address indexed seller, bool isStone, uint256 indexed tokenId, uint256 price, uint256 fee);
    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeReceiverUpdated(address oldReceiver, address newReceiver);

    constructor(address _stone, address _tool, address _token) Ownable(msg.sender) {
        stone = IERC721(_stone);
        tool = IERC721(_tool);
        token = IERC20(_token);
        feeBps = 250;
        feeReceiver = msg.sender;
    }

    // ========== Admin ==========

    function setFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= MAX_FEE_BPS, "Fee too high");
        emit FeeUpdated(feeBps, _feeBps);
        feeBps = _feeBps;
    }

    function setFeeReceiver(address _receiver) external onlyOwner {
        require(_receiver != address(0), "Zero address");
        emit FeeReceiverUpdated(feeReceiver, _receiver);
        feeReceiver = _receiver;
    }

    // ========== Listing (挂单) ==========

    function list(bool _isStone, uint256 tokenId, uint256 price) external {
        IERC721 nft = _isStone ? stone : tool;
        require(nft.ownerOf(tokenId) == msg.sender, "Not owner");
        require(price > 0, "Invalid price");

        bytes32 key = _makeKey(_isStone, tokenId);
        listings[key] = Listing(msg.sender, price, true);
        isStone[key] = _isStone;

        emit Listed(msg.sender, _isStone, tokenId, price);
    }

    function delist(bool _isStone, uint256 tokenId) external {
        bytes32 key = _makeKey(_isStone, tokenId);
        Listing storage listing = listings[key];
        require(listing.seller == msg.sender, "Not seller");

        listing.active = false;
        emit Delisted(msg.sender, _isStone, tokenId);
    }

    function buy(bool _isStone, uint256 tokenId) external {
        bytes32 key = _makeKey(_isStone, tokenId);
        Listing storage listing = listings[key];
        require(listing.active, "Not listed");

        address seller = listing.seller;
        uint256 price = listing.price;
        listing.active = false;

        _settleTrade(_isStone, tokenId, seller, msg.sender, price, true);
        emit Sold(msg.sender, seller, _isStone, tokenId, price, _calcFee(price));
    }

    // ========== Offer (出价) ==========

    function makeOffer(bool _isStone, uint256 tokenId, uint256 price) external {
        require(price > 0, "Invalid price");

        bytes32 key = _makeKey(_isStone, tokenId);
        Offer storage offer = offers[key];
        require(!offer.active, "Existing offer");

        // Escrow: transfer tokens from buyer to contract
        require(token.transferFrom(msg.sender, address(this), price), "Transfer failed");

        offers[key] = Offer(msg.sender, price, true);
        emit OfferMade(msg.sender, _isStone, tokenId, price);
    }

    function cancelOffer(bool _isStone, uint256 tokenId) external {
        bytes32 key = _makeKey(_isStone, tokenId);
        Offer storage offer = offers[key];
        require(offer.buyer == msg.sender, "Not your offer");
        require(offer.active, "Not active");

        uint256 price = offer.price;
        offer.active = false;

        // Refund: transfer tokens back to buyer
        require(token.transfer(msg.sender, price), "Refund failed");
        emit OfferCancelled(msg.sender, _isStone, tokenId);
    }

    function acceptOffer(bool _isStone, uint256 tokenId, address buyer) external {
        IERC721 nft = _isStone ? stone : tool;
        require(nft.ownerOf(tokenId) == msg.sender, "Not owner");

        bytes32 key = _makeKey(_isStone, tokenId);
        Offer storage offer = offers[key];
        require(offer.active && offer.buyer == buyer, "Invalid offer");

        uint256 price = offer.price;
        offer.active = false;

        _settleTrade(_isStone, tokenId, msg.sender, buyer, price, false);
        emit OfferAccepted(buyer, msg.sender, _isStone, tokenId, price, _calcFee(price));
    }

    // ========== Query ==========

    function getSaleHistory(bool _isStone, uint256 tokenId) external view returns (uint256[] memory) {
        return saleHistory[_makeKey(_isStone, tokenId)];
    }

    function getOffer(bool _isStone, uint256 tokenId) external view returns (address buyer, uint256 price, bool active) {
        Offer storage offer = offers[_makeKey(_isStone, tokenId)];
        return (offer.buyer, offer.price, offer.active);
    }

    // ========== Internal ==========

    function _makeKey(bool _isStone, uint256 tokenId) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(_isStone, tokenId));
    }

    function _calcFee(uint256 price) internal view returns (uint256) {
        return (price * feeBps) / 10000;
    }

    function _settleTrade(bool _isStone, uint256 tokenId, address seller, address buyer, uint256 price, bool fromBuyer) private {
        uint256 fee = _calcFee(price);
        uint256 sellerProceeds = price - fee;

        // Payment
        if (fromBuyer) {
            // buy(): buyer pays, split between seller and feeReceiver
            require(token.transferFrom(buyer, seller, sellerProceeds), "Seller transfer failed");
            if (fee > 0) {
                require(token.transferFrom(buyer, feeReceiver, fee), "Fee transfer failed");
            }
        } else {
            // acceptOffer(): funds already escrowed, distribute
            require(token.transfer(seller, sellerProceeds), "Seller transfer failed");
            if (fee > 0) {
                require(token.transfer(feeReceiver, fee), "Fee transfer failed");
            }
        }

        // NFT transfer
        IERC721 nft = _isStone ? stone : tool;
        nft.transferFrom(seller, buyer, tokenId);

        // Sale history (keep last 10)
        uint256[] storage history = saleHistory[_makeKey(_isStone, tokenId)];
        history.push(price);
        if (history.length > 10) {
            // shift left by 1
            for (uint256 i = 0; i < 9; i++) {
                history[i] = history[i + 1];
            }
            history.pop();
        }
    }
}
