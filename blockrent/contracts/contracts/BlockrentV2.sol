// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title BlockrentV2
 * @dev Enhanced decentralized marketplace with wallet-first approach, dispute resolution, and comprehensive features
 */
contract BlockrentV2 is ReentrancyGuard, Pausable, Ownable {
    using Counters for Counters.Counter;

    // ============ Events ============
    event ListingCreated(
        uint256 indexed listingId, 
        address indexed owner, 
        string category,
        uint256 price, 
        uint256 deposit,
        string ipfsHash,
        bool isForRent
    );
    
    event ListingUpdated(
        uint256 indexed listingId,
        uint256 newPrice,
        uint256 newDeposit,
        string newIpfsHash
    );
    
    event ListingDeleted(uint256 indexed listingId, address indexed owner);
    
    event TransactionStarted(
        uint256 indexed transactionId,
        uint256 indexed listingId,
        address indexed buyer,
        address seller,
        uint256 amount,
        uint8 transactionType
    );
    
    event TransactionConfirmed(
        uint256 indexed transactionId,
        address indexed confirmer,
        bool isBuyer
    );
    
    event TransactionCompleted(
        uint256 indexed transactionId,
        uint256 timestamp
    );
    
    event DisputeCreated(
        uint256 indexed disputeId,
        uint256 indexed transactionId,
        address indexed initiator,
        string reason
    );
    
    event DisputeResolved(
        uint256 indexed disputeId,
        address winner,
        uint256 timestamp
    );
    
    event ReviewSubmitted(
        uint256 indexed reviewId,
        uint256 indexed transactionId,
        address indexed reviewer,
        address reviewee,
        uint8 rating,
        string ipfsHash
    );
    
    event UserProfileUpdated(
        address indexed user,
        string ipfsHash
    );
    
    event MessageSent(
        address indexed from,
        address indexed to,
        uint256 indexed transactionId,
        string ipfsHash
    );

    // ============ Enums ============
    enum TransactionType { SALE, RENT }
    enum TransactionStatus { 
        ACTIVE,
        AWAITING_BUYER_CONFIRMATION,
        AWAITING_SELLER_CONFIRMATION,
        COMPLETED,
        DISPUTED,
        CANCELLED,
        REFUNDED
    }
    enum DisputeStatus { OPEN, UNDER_REVIEW, RESOLVED }
    enum ListingCategory { 
        ELECTRONICS,
        VEHICLES,
        REAL_ESTATE,
        FASHION,
        COLLECTIBLES,
        SERVICES,
        OTHER
    }

    // ============ Structs ============
    struct Listing {
        uint256 id;
        address owner;
        string category;
        uint256 price;
        uint256 deposit;
        string ipfsHash;
        bool isForRent;
        bool isActive;
        uint256 views;
        uint256 favorites;
        uint256 createdAt;
        uint256 updatedAt;
    }

    struct Transaction {
        uint256 id;
        uint256 listingId;
        address buyer;
        address seller;
        TransactionType txType;
        uint256 price;
        uint256 deposit;
        uint256 startedAt;
        uint256 completedAt;
        TransactionStatus status;
        bool buyerConfirmed;
        bool sellerConfirmed;
        uint256 escrowAmount;
    }

    struct Dispute {
        uint256 id;
        uint256 transactionId;
        address initiator;
        address defendant;
        string reason;
        string ipfsHash; // Evidence stored on IPFS
        DisputeStatus status;
        address winner;
        uint256 createdAt;
        uint256 resolvedAt;
    }

    struct Review {
        uint256 id;
        uint256 transactionId;
        address reviewer;
        address reviewee;
        uint8 rating; // 1-5 stars
        string ipfsHash; // Review text stored on IPFS
        uint256 timestamp;
    }

    struct UserProfile {
        address wallet;
        string ipfsHash; // Profile data on IPFS
        uint256 totalListings;
        uint256 completedTransactions;
        uint256 totalReviews;
        uint256 ratingSum;
        uint256 averageRating; // Scaled by 100 (e.g., 450 = 4.50 stars)
        bool isVerified;
        uint256 reputationScore;
        uint256 joinedAt;
    }

    // ============ State Variables ============
    Counters.Counter private _listingIds;
    Counters.Counter private _transactionIds;
    Counters.Counter private _disputeIds;
    Counters.Counter private _reviewIds;

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Transaction) public transactions;
    mapping(uint256 => Dispute) public disputes;
    mapping(uint256 => Review) public reviews;
    mapping(address => UserProfile) public userProfiles;
    
    // Transaction lookup by listing
    mapping(uint256 => uint256[]) public listingTransactions;
    
    // User's transactions
    mapping(address => uint256[]) public userTransactions;
    
    // User's reviews
    mapping(address => uint256[]) public userReviews;
    
    // Favorites
    mapping(address => mapping(uint256 => bool)) public userFavorites;
    
    // Admin addresses
    mapping(address => bool) public admins;
    
    // Platform settings
    uint256 public platformFee = 250; // 2.5% (basis points)
    uint256 public disputeFee = 100; // 1% dispute handling fee
    address public feeRecipient;
    uint256 public minDisputeStake = 0.01 ether;

    // ============ Modifiers ============
    modifier onlyAdmin() {
        require(admins[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    modifier onlyListingOwner(uint256 _listingId) {
        require(listings[_listingId].owner == msg.sender, "Not listing owner");
        _;
    }

    modifier listingExists(uint256 _listingId) {
        require(_listingIds.current() >= _listingId && _listingId > 0, "Listing does not exist");
        _;
    }

    modifier transactionExists(uint256 _transactionId) {
        require(_transactionIds.current() >= _transactionId && _transactionId > 0, "Transaction does not exist");
        _;
    }

    // ============ Constructor ============
    constructor(address _feeRecipient) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _feeRecipient;
        admins[msg.sender] = true;
    }

    // ============ Listing Functions ============
    
    /**
     * @dev Create a new listing
     */
    function createListing(
        string memory _category,
        uint256 _price,
        uint256 _deposit,
        string memory _ipfsHash,
        bool _isForRent
    ) external whenNotPaused nonReentrant returns (uint256) {
        require(_price > 0, "Price must be greater than 0");
        require(bytes(_ipfsHash).length > 0, "IPFS hash required");
        require(bytes(_category).length > 0, "Category required");

        _listingIds.increment();
        uint256 listingId = _listingIds.current();

        listings[listingId] = Listing({
            id: listingId,
            owner: msg.sender,
            category: _category,
            price: _price,
            deposit: _deposit,
            ipfsHash: _ipfsHash,
            isForRent: _isForRent,
            isActive: true,
            views: 0,
            favorites: 0,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        // Update user profile
        if (userProfiles[msg.sender].wallet == address(0)) {
            _initializeUserProfile(msg.sender);
        }
        userProfiles[msg.sender].totalListings++;

        emit ListingCreated(listingId, msg.sender, _category, _price, _deposit, _ipfsHash, _isForRent);
        return listingId;
    }

    /**
     * @dev Update an existing listing
     */
    function updateListing(
        uint256 _listingId,
        uint256 _newPrice,
        uint256 _newDeposit,
        string memory _newIpfsHash
    ) external listingExists(_listingId) onlyListingOwner(_listingId) nonReentrant {
        Listing storage listing = listings[_listingId];
        require(listing.isActive, "Listing not active");
        
        if (_newPrice > 0) listing.price = _newPrice;
        if (_newDeposit > 0) listing.deposit = _newDeposit;
        if (bytes(_newIpfsHash).length > 0) listing.ipfsHash = _newIpfsHash;
        
        listing.updatedAt = block.timestamp;

        emit ListingUpdated(_listingId, _newPrice, _newDeposit, _newIpfsHash);
    }

    /**
     * @dev Delete/deactivate a listing
     */
    function deleteListing(uint256 _listingId) 
        external 
        listingExists(_listingId) 
        nonReentrant 
    {
        Listing storage listing = listings[_listingId];
        require(
            listing.owner == msg.sender || admins[msg.sender] || msg.sender == owner(),
            "Not authorized"
        );
        require(listing.isActive, "Listing already inactive");

        listing.isActive = false;
        listing.updatedAt = block.timestamp;

        emit ListingDeleted(_listingId, msg.sender);
    }

    /**
     * @dev Increment view count for a listing
     */
    function incrementViews(uint256 _listingId) external listingExists(_listingId) {
        listings[_listingId].views++;
    }

    /**
     * @dev Toggle favorite status for a listing
     */
    function toggleFavorite(uint256 _listingId) external listingExists(_listingId) {
        bool isFavorited = userFavorites[msg.sender][_listingId];
        userFavorites[msg.sender][_listingId] = !isFavorited;
        
        if (isFavorited) {
            listings[_listingId].favorites--;
        } else {
            listings[_listingId].favorites++;
        }
    }

    // ============ Transaction Functions ============
    
    /**
     * @dev Initiate a purchase or rental transaction
     */
    function createTransaction(uint256 _listingId) 
        external 
        payable 
        whenNotPaused 
        nonReentrant 
        listingExists(_listingId) 
        returns (uint256) 
    {
        Listing memory listing = listings[_listingId];
        require(listing.isActive, "Listing not active");
        require(listing.owner != msg.sender, "Cannot buy own listing");

        uint256 totalRequired = listing.isForRent 
            ? listing.price + listing.deposit 
            : listing.price;
        require(msg.value >= totalRequired, "Insufficient payment");

        _transactionIds.increment();
        uint256 transactionId = _transactionIds.current();

        transactions[transactionId] = Transaction({
            id: transactionId,
            listingId: _listingId,
            buyer: msg.sender,
            seller: listing.owner,
            txType: listing.isForRent ? TransactionType.RENT : TransactionType.SALE,
            price: listing.price,
            deposit: listing.isForRent ? listing.deposit : 0,
            startedAt: block.timestamp,
            completedAt: 0,
            status: TransactionStatus.ACTIVE,
            buyerConfirmed: false,
            sellerConfirmed: false,
            escrowAmount: totalRequired
        });

        // Link transaction to listing and users
        listingTransactions[_listingId].push(transactionId);
        userTransactions[msg.sender].push(transactionId);
        userTransactions[listing.owner].push(transactionId);

        // Initialize user profiles if needed
        if (userProfiles[msg.sender].wallet == address(0)) {
            _initializeUserProfile(msg.sender);
        }
        if (userProfiles[listing.owner].wallet == address(0)) {
            _initializeUserProfile(listing.owner);
        }

        // Refund excess payment
        if (msg.value > totalRequired) {
            (bool success, ) = payable(msg.sender).call{value: msg.value - totalRequired}("");
            require(success, "Refund failed");
        }

        // Deactivate listing for sales (keep active for rentals)
        if (!listing.isForRent) {
            listings[_listingId].isActive = false;
        }

        emit TransactionStarted(
            transactionId,
            _listingId,
            msg.sender,
            listing.owner,
            totalRequired,
            uint8(listing.isForRent ? 1 : 0)
        );

        return transactionId;
    }

    /**
     * @dev Buyer confirms receipt of item/service
     */
    function confirmReceipt(uint256 _transactionId) 
        external 
        nonReentrant 
        transactionExists(_transactionId) 
    {
        Transaction storage transaction = transactions[_transactionId];
        require(transaction.buyer == msg.sender, "Not the buyer");
        require(
            transaction.status == TransactionStatus.ACTIVE ||
            transaction.status == TransactionStatus.AWAITING_BUYER_CONFIRMATION,
            "Invalid transaction status"
        );

        transaction.buyerConfirmed = true;
        emit TransactionConfirmed(_transactionId, msg.sender, true);

        if (transaction.sellerConfirmed) {
            _completeTransaction(_transactionId);
        } else {
            transaction.status = TransactionStatus.AWAITING_SELLER_CONFIRMATION;
        }
    }

    /**
     * @dev Seller confirms delivery of item/service
     */
    function confirmDelivery(uint256 _transactionId) 
        external 
        nonReentrant 
        transactionExists(_transactionId) 
    {
        Transaction storage transaction = transactions[_transactionId];
        require(transaction.seller == msg.sender, "Not the seller");
        require(
            transaction.status == TransactionStatus.ACTIVE ||
            transaction.status == TransactionStatus.AWAITING_SELLER_CONFIRMATION,
            "Invalid transaction status"
        );

        transaction.sellerConfirmed = true;
        emit TransactionConfirmed(_transactionId, msg.sender, false);

        if (transaction.buyerConfirmed) {
            _completeTransaction(_transactionId);
        } else {
            transaction.status = TransactionStatus.AWAITING_BUYER_CONFIRMATION;
        }
    }

    /**
     * @dev Internal function to complete a transaction
     */
    function _completeTransaction(uint256 _transactionId) internal {
        Transaction storage transaction = transactions[_transactionId];
        require(transaction.escrowAmount > 0, "No funds in escrow");
        
        // Calculate and transfer funds
        uint256 fee = (transaction.price * platformFee) / 10000;
        uint256 sellerAmount = transaction.price - fee;
        uint256 depositAmount = transaction.deposit;

        // CRITICAL: Update ALL state BEFORE external calls (Checks-Effects-Interactions pattern)
        transaction.status = TransactionStatus.COMPLETED;
        transaction.completedAt = block.timestamp;
        transaction.escrowAmount = 0; // Reset escrow to prevent double-spending

        // Update user profiles with overflow protection
        userProfiles[transaction.buyer].completedTransactions++;
        userProfiles[transaction.seller].completedTransactions++;
        
        uint256 newBuyerScore = userProfiles[transaction.buyer].reputationScore + 10;
        uint256 newSellerScore = userProfiles[transaction.seller].reputationScore + 10;
        require(newBuyerScore >= userProfiles[transaction.buyer].reputationScore, "Buyer reputation overflow");
        require(newSellerScore >= userProfiles[transaction.seller].reputationScore, "Seller reputation overflow");
        
        userProfiles[transaction.buyer].reputationScore = newBuyerScore;
        userProfiles[transaction.seller].reputationScore = newSellerScore;

        // NOW safe to make external calls
        // Transfer platform fee
        (bool feeSuccess, ) = payable(feeRecipient).call{value: fee}("");
        require(feeSuccess, "Fee transfer failed");

        // Transfer to seller
        (bool sellerSuccess, ) = payable(transaction.seller).call{value: sellerAmount}("");
        require(sellerSuccess, "Seller payment failed");

        // Return deposit if applicable
        if (depositAmount > 0) {
            (bool depositSuccess, ) = payable(transaction.buyer).call{value: depositAmount}("");
            require(depositSuccess, "Deposit refund failed");
        }

        emit TransactionCompleted(_transactionId, block.timestamp);
    }

    // ============ Dispute Functions ============
    
    /**
     * @dev Create a dispute for a transaction
     */
    function createDispute(
        uint256 _transactionId,
        string memory _reason,
        string memory _evidenceIpfsHash
    ) external payable nonReentrant transactionExists(_transactionId) returns (uint256) {
        Transaction memory transaction = transactions[_transactionId];
        require(
            transaction.buyer == msg.sender || transaction.seller == msg.sender,
            "Not a transaction participant"
        );
        require(
            transaction.status == TransactionStatus.ACTIVE ||
            transaction.status == TransactionStatus.AWAITING_BUYER_CONFIRMATION ||
            transaction.status == TransactionStatus.AWAITING_SELLER_CONFIRMATION,
            "Cannot dispute this transaction"
        );
        require(msg.value >= minDisputeStake, "Insufficient dispute stake");

        _disputeIds.increment();
        uint256 disputeId = _disputeIds.current();

        address defendant = transaction.buyer == msg.sender 
            ? transaction.seller 
            : transaction.buyer;

        disputes[disputeId] = Dispute({
            id: disputeId,
            transactionId: _transactionId,
            initiator: msg.sender,
            defendant: defendant,
            reason: _reason,
            ipfsHash: _evidenceIpfsHash,
            status: DisputeStatus.OPEN,
            winner: address(0),
            createdAt: block.timestamp,
            resolvedAt: 0
        });

        transactions[_transactionId].status = TransactionStatus.DISPUTED;

        emit DisputeCreated(disputeId, _transactionId, msg.sender, _reason);
        return disputeId;
    }

    /**
     * @dev Resolve a dispute (admin only)
     */
    function resolveDispute(
        uint256 _disputeId,
        address _winner
    ) external onlyAdmin nonReentrant {
        Dispute storage dispute = disputes[_disputeId];
        require(dispute.status == DisputeStatus.OPEN || dispute.status == DisputeStatus.UNDER_REVIEW, "Dispute not open");
        require(
            _winner == dispute.initiator || _winner == dispute.defendant,
            "Winner must be a participant"
        );

        Transaction storage transaction = transactions[dispute.transactionId];
        uint256 escrowAmount = transaction.escrowAmount;
        require(escrowAmount > 0, "No funds in escrow");
        
        uint256 disputeFeeAmount = (escrowAmount * disputeFee) / 10000;
        uint256 winnerAmount = escrowAmount - disputeFeeAmount;

        // CRITICAL: Update ALL state BEFORE external calls (Checks-Effects-Interactions pattern)
        dispute.status = DisputeStatus.RESOLVED;
        dispute.winner = _winner;
        dispute.resolvedAt = block.timestamp;
        transaction.status = TransactionStatus.REFUNDED;
        transaction.escrowAmount = 0; // Reset escrow to prevent double-spending

        // Update reputation (winner gets bonus, loser gets penalty)
        address loser = _winner == dispute.initiator ? dispute.defendant : dispute.initiator;
        
        // Safe reputation update with overflow protection
        uint256 newWinnerScore = userProfiles[_winner].reputationScore + 20;
        require(newWinnerScore >= userProfiles[_winner].reputationScore, "Reputation overflow");
        userProfiles[_winner].reputationScore = newWinnerScore;
        
        if (userProfiles[loser].reputationScore >= 30) {
            userProfiles[loser].reputationScore -= 30;
        } else {
            userProfiles[loser].reputationScore = 0;
        }

        // NOW safe to make external calls
        // Transfer dispute fee to platform
        (bool feeSuccess, ) = payable(feeRecipient).call{value: disputeFeeAmount}("");
        require(feeSuccess, "Fee transfer failed");

        // Transfer remaining funds to winner
        (bool winnerSuccess, ) = payable(_winner).call{value: winnerAmount}("");
        require(winnerSuccess, "Winner payment failed");

        emit DisputeResolved(_disputeId, _winner, block.timestamp);
    }

    // ============ Review Functions ============
    
    /**
     * @dev Submit a review for a completed transaction
     */
    function submitReview(
        uint256 _transactionId,
        address _reviewee,
        uint8 _rating,
        string memory _reviewIpfsHash
    ) external nonReentrant transactionExists(_transactionId) returns (uint256) {
        require(_rating >= 1 && _rating <= 5, "Rating must be 1-5");
        
        Transaction memory transaction = transactions[_transactionId];
        require(transaction.status == TransactionStatus.COMPLETED, "Transaction not completed");
        require(
            (transaction.buyer == msg.sender && transaction.seller == _reviewee) ||
            (transaction.seller == msg.sender && transaction.buyer == _reviewee),
            "Invalid review participants"
        );

        _reviewIds.increment();
        uint256 reviewId = _reviewIds.current();

        reviews[reviewId] = Review({
            id: reviewId,
            transactionId: _transactionId,
            reviewer: msg.sender,
            reviewee: _reviewee,
            rating: _rating,
            ipfsHash: _reviewIpfsHash,
            timestamp: block.timestamp
        });

        userReviews[_reviewee].push(reviewId);

        // Update reviewee's profile
        UserProfile storage profile = userProfiles[_reviewee];
        profile.totalReviews++;
        profile.ratingSum += _rating;
        profile.averageRating = (profile.ratingSum * 100) / profile.totalReviews;

        // Reputation bonus for high ratings
        if (_rating >= 4) {
            profile.reputationScore += (_rating - 3) * 5;
        }

        emit ReviewSubmitted(reviewId, _transactionId, msg.sender, _reviewee, _rating, _reviewIpfsHash);
        return reviewId;
    }

    // ============ User Profile Functions ============
    
    /**
     * @dev Initialize a user profile
     */
    function _initializeUserProfile(address _user) internal {
        userProfiles[_user] = UserProfile({
            wallet: _user,
            ipfsHash: "",
            totalListings: 0,
            completedTransactions: 0,
            totalReviews: 0,
            ratingSum: 0,
            averageRating: 0,
            isVerified: false,
            reputationScore: 0,
            joinedAt: block.timestamp
        });
    }

    /**
     * @dev Update user profile IPFS hash
     */
    function updateProfile(string memory _ipfsHash) external {
        if (userProfiles[msg.sender].wallet == address(0)) {
            _initializeUserProfile(msg.sender);
        }
        userProfiles[msg.sender].ipfsHash = _ipfsHash;
        emit UserProfileUpdated(msg.sender, _ipfsHash);
    }

    /**
     * @dev Verify a user (admin only)
     */
    function verifyUser(address _user) external onlyAdmin {
        require(userProfiles[_user].wallet != address(0), "User profile does not exist");
        userProfiles[_user].isVerified = true;
        userProfiles[_user].reputationScore += 50;
    }

    // ============ Admin Functions ============
    
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function addAdmin(address _admin) external onlyOwner {
        admins[_admin] = true;
    }

    function removeAdmin(address _admin) external onlyOwner {
        admins[_admin] = false;
    }

    function setPlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 1000, "Fee cannot exceed 10%");
        platformFee = _newFee;
    }

    function setDisputeFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 500, "Dispute fee cannot exceed 5%");
        disputeFee = _newFee;
    }

    function setMinDisputeStake(uint256 _newStake) external onlyOwner {
        minDisputeStake = _newStake;
    }

    function setFeeRecipient(address _newRecipient) external onlyOwner {
        require(_newRecipient != address(0), "Invalid address");
        feeRecipient = _newRecipient;
    }

    // ============ View Functions ============
    
    function getListing(uint256 _listingId) external view returns (Listing memory) {
        return listings[_listingId];
    }

    function getTransaction(uint256 _transactionId) external view returns (Transaction memory) {
        return transactions[_transactionId];
    }

    function getDispute(uint256 _disputeId) external view returns (Dispute memory) {
        return disputes[_disputeId];
    }

    function getReview(uint256 _reviewId) external view returns (Review memory) {
        return reviews[_reviewId];
    }

    function getUserProfile(address _user) external view returns (UserProfile memory) {
        return userProfiles[_user];
    }

    function getUserTransactions(address _user) external view returns (uint256[] memory) {
        return userTransactions[_user];
    }

    function getUserReviews(address _user) external view returns (uint256[] memory) {
        return userReviews[_user];
    }

    function getListingTransactions(uint256 _listingId) external view returns (uint256[] memory) {
        return listingTransactions[_listingId];
    }

    function isFavorited(address _user, uint256 _listingId) external view returns (bool) {
        return userFavorites[_user][_listingId];
    }

    function getTotalListings() external view returns (uint256) {
        return _listingIds.current();
    }

    function getTotalTransactions() external view returns (uint256) {
        return _transactionIds.current();
    }

    function getTotalDisputes() external view returns (uint256) {
        return _disputeIds.current();
    }

    function getTotalReviews() external view returns (uint256) {
        return _reviewIds.current();
    }

    // ============ Emergency Functions ============
    
    /**
     * @dev Emergency withdrawal (owner only, when paused)
     */
    function emergencyWithdraw() external onlyOwner whenPaused {
        payable(owner()).transfer(address(this).balance);
    }

    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
}
