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

    struct Auction {
        address seller;
        uint256 startPrice;
        uint256 minBidIncrement;
        uint256 endTime;
        address highestBidder;
        uint256 highestBid;
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
    mapping(bytes32 => Auction) public auctions;
    mapping(bytes32 => uint256[]) public saleHistory; // last 10 sale prices per NFT

    event Listed(address indexed seller, bool isStone, uint256 indexed tokenId, uint256 price);
    event Delisted(address indexed seller, bool isStone, uint256 indexed tokenId);
    event Sold(address indexed buyer, address indexed seller, bool isStone, uint256 indexed tokenId, uint256 price, uint256 fee);
    event OfferMade(address indexed buyer, bool isStone, uint256 indexed tokenId, uint256 price);
    event OfferCancelled(address indexed buyer, bool isStone, uint256 indexed tokenId);
    event OfferAccepted(address indexed buyer, address indexed seller, bool isStone, uint256 indexed tokenId, uint256 price, uint256 fee);
    event AuctionStarted(address indexed seller, bool isStone, uint256 indexed tokenId, uint256 startPrice, uint256 endTime);
    event AuctionBid(address indexed bidder, bool isStone, uint256 indexed tokenId, uint256 bid);
    event AuctionSettled(address indexed winner, address indexed seller, bool isStone, uint256 indexed tokenId, uint256 price, uint256 fee);
    event AuctionCancelled(address indexed seller, bool isStone, uint256 indexed tokenId);
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

    // ========== Auction (拍卖) ==========

    function startAuction(bool _isStone, uint256 tokenId, uint256 _startPrice, uint256 _minBidIncrement, uint256 _duration) external {
        IERC721 nft = _isStone ? stone : tool;
        require(nft.ownerOf(tokenId) == msg.sender, "Not owner");
        require(_startPrice > 0, "Invalid start price");
        require(_duration >= 60 && _duration <= 30 days, "Invalid duration");

        bytes32 key = _makeKey(_isStone, tokenId);
        require(!auctions[key].active, "Auction exists");
        require(!listings[key].active, "Already listed");

        // Escrow NFT in contract
        nft.transferFrom(msg.sender, address(this), tokenId);

        auctions[key] = Auction({
            seller: msg.sender,
            startPrice: _startPrice,
            minBidIncrement: _minBidIncrement,
            endTime: block.timestamp + _duration,
            highestBidder: address(0),
            highestBid: 0,
            active: true
        });
        isStone[key] = _isStone;

        emit AuctionStarted(msg.sender, _isStone, tokenId, _startPrice, block.timestamp + _duration);
    }

    function bid(bool _isStone, uint256 tokenId, uint256 _bidAmount) external {
        bytes32 key = _makeKey(_isStone, tokenId);
        Auction storage auction = auctions[key];
        require(auction.active, "Not active");
        require(block.timestamp < auction.endTime, "Auction ended");

        uint256 minBid = auction.highestBidder == address(0)
            ? auction.startPrice
            : auction.highestBid + auction.minBidIncrement;
        require(_bidAmount >= minBid, "Bid too low");

        // Refund previous highest bidder
        if (auction.highestBidder != address(0)) {
            require(token.transfer(auction.highestBidder, auction.highestBid), "Refund failed");
        }

        // Escrow new bid
        require(token.transferFrom(msg.sender, address(this), _bidAmount), "Bid transfer failed");

        auction.highestBidder = msg.sender;
        auction.highestBid = _bidAmount;

        emit AuctionBid(msg.sender, _isStone, tokenId, _bidAmount);
    }

    function settleAuction(bool _isStone, uint256 tokenId) external {
        bytes32 key = _makeKey(_isStone, tokenId);
        Auction storage auction = auctions[key];
        require(auction.active, "Not active");
        require(block.timestamp >= auction.endTime, "Not ended");

        auction.active = false;

        if (auction.highestBidder != address(0)) {
            // Has bids: settle normally
            _settleAuctionTrade(_isStone, tokenId, key, auction);
            emit AuctionSettled(auction.highestBidder, auction.seller, _isStone, tokenId, auction.highestBid, _calcFee(auction.highestBid));
        } else {
            // No bids: return NFT to seller
            IERC721 nft = _isStone ? stone : tool;
            nft.transferFrom(address(this), auction.seller, tokenId);
            emit AuctionCancelled(auction.seller, _isStone, tokenId);
        }
    }

    function cancelAuction(bool _isStone, uint256 tokenId) external {
        bytes32 key = _makeKey(_isStone, tokenId);
        Auction storage auction = auctions[key];
        require(auction.active, "Not active");
        require(auction.seller == msg.sender, "Not seller");
        require(auction.highestBidder == address(0), "Has bids");

        auction.active = false;

        IERC721 nft = _isStone ? stone : tool;
        nft.transferFrom(address(this), auction.seller, tokenId);
        emit AuctionCancelled(msg.sender, _isStone, tokenId);
    }

    function getAuction(bool _isStone, uint256 tokenId) external view returns (
        address seller, uint256 startPrice, uint256 minBidIncrement,
        uint256 endTime, address highestBidder, uint256 highestBid, bool active
    ) {
        Auction storage a = auctions[_makeKey(_isStone, tokenId)];
        return (a.seller, a.startPrice, a.minBidIncrement, a.endTime, a.highestBidder, a.highestBid, a.active);
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

    function _settleAuctionTrade(bool _isStone, uint256 tokenId, bytes32 key, Auction storage auction) private {
        uint256 price = auction.highestBid;
        uint256 fee = _calcFee(price);
        uint256 sellerProceeds = price - fee;

        // Pay seller from escrow
        require(token.transfer(auction.seller, sellerProceeds), "Seller transfer failed");
        if (fee > 0) {
            require(token.transfer(feeReceiver, fee), "Fee transfer failed");
        }

        // Transfer NFT from contract to winner
        IERC721 nft = _isStone ? stone : tool;
        nft.transferFrom(address(this), auction.highestBidder, tokenId);

        // Sale history
        uint256[] storage history = saleHistory[key];
        history.push(price);
        if (history.length > 10) {
            for (uint256 i = 0; i < 9; i++) {
                history[i] = history[i + 1];
            }
            history.pop();
        }
    }
}
