# Blockrent: System Architecture Document

This document outlines the system architecture for the Blockrent platform, a decentralized marketplace for renting and selling goods.

## 1. High-Level Overview

Blockrent is a decentralized application (dApp) that facilitates a secure and transparent marketplace for renting and selling physical goods. Leveraging blockchain technology, it provides a trustless environment for users to list items, engage in transactions (both rental and sale), and manage their digital identity. The platform's architecture is designed as a monorepo with three core components: a React-based frontend, a Node.js (Express) backend, and Solidity smart contracts deployed on an EVM-compatible blockchain.

## 2. Tech Stack

The project is organized into a monorepo with three distinct parts: `frontend`, `backend`, and `contracts`.

### 2.1. Frontend (`/frontend`)

-   **Framework:** React `18.2.0`
-   **UI Library:** Chakra UI (`@chakra-ui/react`) for components and styling.
-   **Routing:** React Router (`react-router-dom`) for navigation.
    -   **File:** `frontend/src/App.js`
-   **State Management:** React Context API for managing global state like web3 connectivity and authentication.
    -   **Files:** `frontend/src/context/Web3Context.js`, `frontend/src/context/AuthContext.js`
-   **Blockchain Interaction:** `ethers.js` for communicating with the smart contract and user wallets (via MetaMask).
-   **Wallet Integration:** `web3modal` to provide a simple UI for connecting different wallets.

### 2.2. Backend (`/backend`)

-   **Framework:** Express.js for the REST API.
    -   **File:** `backend/server.js`
-   **Database:** MySQL (`mysql2` driver) for caching off-chain data like user profiles, listing metadata, and transaction history.
    -   **Files:** `backend/database/db.js`, `backend/database/schema.sql`
-   **Authentication:** Custom wallet-based authentication using `bcryptjs` for session management and `ethers.js` for signature verification.
    -   **File:** `backend/routes/auth.js`
-   **Blockchain Interaction:** `ethers.js` to listen to contract events and sync data with the database.
    -   **File:** `backend/services/blockchainSync.js`
-   **Real-time Communication:** `socket.io` for pushing real-time updates (e.g., notifications) to the frontend.
-   **File Storage (Metadata):** `web3.storage` for pinning data to IPFS.
    -   **File:** `backend/services/ipfsService.js`

### 2.3. Smart Contracts (`/contracts`)

-   **Language:** Solidity `^0.8.19`
-   **Framework:** Hardhat for development, testing, and deployment.
    -   **File:** `contracts/hardhat.config.js`
-   **Core Contract:** `BlockrentV2.sol` contains the primary logic for listings, transactions, and user profiles.
    -   **File:** `contracts/contracts/BlockrentV2.sol`
-   **Standards:** Inherits from OpenZeppelin contracts (`@openzeppelin/contracts`) for security best practices (e.g., `ReentrancyGuard`, `Pausable`, `Ownable`).

## 3. Core User Journeys & Feature Implementation

### Implemented

#### 3.1. Login via MetaMask

**Goal:** Allow users to authenticate securely using their MetaMask wallet, establishing a session with the backend, and optionally collecting PII for enhanced features.

**Flow:**

1.  **User Initiates Connection (Frontend):**
    *   **Trigger:** User clicks "Connect Wallet" or "Sign In" button (e.g., in `frontend/src/components/Navbar.js` or `frontend/src/pages/SignInPage.js`).
    *   **Action:** The `useWeb3` hook (from `frontend/src/context/Web3Context.js`)'s `connectWallet()` function is called.
    *   **Tech:** `web3modal` (for wallet selection UI), `ethers.js` (for interacting with MetaMask via `window.ethereum`).
    *   **Outcome:** `connectWallet()` returns the user's `walletAddress` and the `ethers.js` `provider`.

2.  **Request Nonce (Frontend -> Backend):**
    *   **Trigger:** If wallet connection is successful, the `useAuth` hook (from `frontend/src/context/AuthContext.js`)'s `login()` function is called with the `walletAddress` and `provider`.
    *   **Action:** The frontend sends a `POST` request to the backend's `/api/auth/nonce` endpoint.
    *   **Tech:** `fetch` API for HTTP request.
    *   **Outcome:** The backend returns a unique `nonce` and a human-readable `message` to be signed.

3.  **User Signs Message (Frontend):**
    *   **Trigger:** The frontend receives the `nonce` and `message` from the backend.
    *   **Action:** The `signMessage()` function (within `frontend/src/context/AuthContext.js`), utilizing the `ethers.js` `provider`, prompts MetaMask for the user to sign the message.
    *   **Tech:** `ethers.js` `signer.signMessage()`.
    *   **Outcome:** MetaMask returns a unique `signature` proving ownership of the wallet address.

4.  **Verify Signature & Create Session (Frontend -> Backend):**
    *   **Trigger:** The frontend has the `walletAddress`, `signature`, `message`, and `nonce`.
    *   **Action:** The frontend sends a `POST` request to the backend's `/api/auth/verify` endpoint, including all these details.
    *   **Tech:** `fetch` API for HTTP request.

5.  **Backend Verification & Session Management:**
    *   **Trigger:** The backend receives the verification request (`backend/routes/auth.js`).
    *   **Action:** The `authService` (using `ethers.js` `verifyMessage()`) verifies the `signature` against the `message` and `walletAddress`. If valid, a new secure `sessionId` is generated and stored in the **MySQL database** (using `mysql2`) along with the `walletAddress`, an `expires_at` timestamp, `IP address`, and `user agent`.
    *   **Session Duration:** The session's lifetime is configurable on the backend (e.g., 24 hours). The `expires_at` timestamp in the database determines its validity. The backend validates this on every authenticated request.
    *   **Tech:** `express.js` (route handling), `ethers.js` (signature verification), `mysql2` (session storage), `backend/services/authService.js` (business logic).
    *   **Outcome:** A `sessionId` is returned to the frontend.
    *   **PII Collection Integration:**
        *   **Action:** During this initial login or subsequent profile setup, if the user has not provided PII (`user.piiProvided` in their profile is `false`), the frontend can trigger a `PiiConsentModal` (`frontend/src/components/PiiConsentModal.js`).
        *   **Action (Backend):** When PII (e.g., `fullName`, `phoneNumber`, `address`) is submitted, the `backend/routes/users.js` endpoint (via a `PUT` request to `/api/users/:walletAddress`) processes this. The PII is **encrypted** using a robust encryption library (e.g., Node.js's built-in `crypto` module) and then stored in the **MySQL database** (`mysql2`). The unencrypted PII is **NEVER** stored on the blockchain.
        *   **Tech:** Frontend: `Chakra UI` for forms, `fetch` for API calls. Backend: `express.js` for routing, `mysql2` for database interaction, Node.js `crypto` module for encryption.
        *   **Outcome:** User profile updated with encrypted PII, `user.piiProvided` flag set to `true`.

6.  **Frontend Establishes Session:**
    *   **Trigger:** The frontend receives the `sessionId`.
    *   **Action:** The `sessionId` is stored in `localStorage` (along with `walletAddress`), and the `isAuthenticated` state is set to `true`. User profile data is fetched and stored in the `AuthContext`.
    *   **Tech:** `localStorage`, React Context.
    *   **Outcome:** User is logged in and authenticated.
#### 3.2. List Marketplace Items

**Goal:** Allow authenticated users to create a new listing for an item to be sold or rented. The process involves creating off-chain metadata (description, images), uploading it to a decentralized file system, and then creating the listing on the blockchain via a smart contract transaction.

**Flow:**

1.  **User Fills Out Form (Frontend):**
    *   **Trigger:** An authenticated user navigates to the `/create` page.
    *   **Action:** The user fills out the form in the `CreateListing` component (`frontend/src/pages/CreateListing.js`). This form captures the title, description, price, deposit, category, and an image (either via file upload or URL).
    *   **Tech:** React (`useState` for form state), `Chakra UI` (for form components).

2.  **Prepare Metadata & Upload to IPFS (Frontend):**
    *   **Trigger:** User clicks the "Create Listing" button.
    *   **Action:**
        1.  If an image file was uploaded, it is first sent to **IPFS** (or a pinning service like `web3.storage`) to get a decentralized URL. The `ipfsSimulation.js` utility (`frontend/src/utils/ipfsSimulation.js`) handles this, and the backend also has `backend/services/ipfsService.js` for server-side pinning.
        2.  A JSON object (the "metadata") is created containing the `title`, `description`, `image` URL, and other details.
        3.  This metadata JSON object is then uploaded to IPFS, resulting in a single `ipfsHash`.
    *   **Tech:** `web3.storage` (or a similar IPFS pinning service), `fetch` API.

3.  **Execute Smart Contract Transaction (Frontend):**
    *   **Trigger:** The frontend has the `ipfsHash` and all on-chain data (price, deposit, etc.).
    *   **Action:** The `handleSubmit` function calls the `createListing` function on the smart contract instance provided by the `useWeb3` hook. The price and deposit are converted to `wei` using `ethers.js`.
    *   **Tech:** `ethers.js`.
    *   **Smart Contract Interaction:**
        *   **Contract:** `BlockrentV2.sol`
        *   **Function:** `createListing(string memory _category, uint256 _price, uint256 _deposit, string memory _ipfsHash, bool _isForRent)`
        *   **Action:** The contract creates a new `Listing` struct, stores it in the `listings` mapping, and emits a `ListingCreated` event with the new `listingId`. The user's wallet (MetaMask) prompts them to confirm the transaction and pay the gas fees.

4.  **Cache Listing in Backend (Frontend -> Backend):**
    *   **Trigger:** The blockchain transaction is successfully confirmed (`tx.wait()`).
    *   **Action:** The frontend sends a `POST` request to the backend's `/api/listings` endpoint. The request body contains the `listingId` from the contract event, the `ipfsHash`, and all the metadata.
    *   **Tech:** `fetch` API.
    *   **Backend Interaction:**
        *   **File:** `backend/routes/listings.js`
        *   **Action:** The backend route receives the data. It verifies that the authenticated user (`req.walletAddress`) is the same as the listing's `seller`. It then saves the listing details into the `listings_cache` table in the **MySQL database** (`mysql2`). This allows for fast querying and searching without needing to constantly read from the blockchain.
        *   **Tech:** `express.js` (route handling), `mysql2` (database write).

5.  **User Feedback (Frontend):**
    *   **Trigger:** The backend confirms the listing has been cached.
    *   **Action:** The frontend displays a success toast notification and redirects the user to the marketplace page, where the new listing will now appear (fetched from the backend's cache).
    *   **Tech:** `Chakra UI Toast`, `react-router-dom` (`useNavigate`).
#### 3.3. Buy / Rent from Marketplace

**Goal:** Enable authenticated and wallet-connected users to initiate a transaction (either sale or rental) for a marketplace item, securely transferring funds via a smart contract escrow and updating backend caches.

**Flow:**

1.  **User Views Listing & Initiates Transaction (Frontend):**
    *   **Trigger:** An authenticated user browses the marketplace (e.g., `frontend/src/pages/Marketplace.js`) and clicks on a listing to view details. From the listing details, they click "Buy" or "Rent" (e.g., via a `ViewDetailsModal`).
    *   **Action:** The frontend retrieves the listing `id`, `price`, `deposit` (if rental), and `isForRent` status.
    *   **Tech:** React (`useState`, `useEffect`), `Chakra UI`.

2.  **Execute Smart Contract Transaction (Frontend):**
    *   **Trigger:** User confirms the transaction details.
    *   **Action:** The `createTransaction` function on the smart contract instance (`useWeb3` hook) is called. The total amount (price + deposit for rental, or just price for sale) is passed as `msg.value` (payable function).
    *   **Tech:** `ethers.js`.
    *   **Smart Contract Interaction:**
        *   **Contract:** `BlockrentV2.sol`
        *   **Function:** `createTransaction(uint256 _listingId)`
        *   **Action:**
            *   The contract receives `msg.value`.
            *   It validates that the `listingId` exists, is active, and the user is not the owner.
            *   It verifies `msg.value` covers the total required amount (price + deposit).
            *   A new `Transaction` struct is created, storing `listingId`, `buyer`, `seller`, `txType`, `price`, `deposit`, `startedAt`, `status` (e.g., `ACTIVE`), and `escrowAmount`.
            *   Any excess `msg.value` is refunded to the buyer.
            *   For sales, the listing's `isActive` status might be set to `false` (if not fractional). For rentals, it remains active.
            *   A `TransactionStarted` event is emitted with the new `transactionId`.
            *   The buyer's wallet (MetaMask) prompts them to confirm the transaction and pay the gas fees.

3.  **Cache Transaction in Backend (Backend via Event Listener):**
    *   **Trigger:** The `TransactionStarted` event is emitted by the `BlockrentV2` smart contract.
    *   **Action:** The `blockchainSync` service (`backend/services/blockchainSync.js`) actively listens for this event. Upon detection, it parses the event data.
    *   **Backend Interaction:**
        *   **File:** `backend/services/blockchainSync.js`
        *   **Action:** The `blockchainSync` service then uses `db.transactionDB.cacheTransaction()` to save the transaction details (including `transactionId`, `listingId`, `buyer`, `seller`, `amount`, `txType`, `status`, etc.) into the `transactions_cache` table in the **MySQL database** (`mysql2`). This ensures that transaction history is quickly queryable for user dashboards.
        *   **Tech:** `ethers.js` (event listening), `mysql2` (database write).

4.  **Confirmation Flow (Frontend & Smart Contract):**
    *   **Trigger:** After the transaction is started, the status on the blockchain is often `ACTIVE` (or similar), meaning both parties need to confirm.
    *   **Action (Buyer):** The buyer confirms receipt of the item/service by calling `confirmReceipt(uint256 _transactionId)` on the smart contract.
    *   **Action (Seller):** The seller confirms delivery of the item/service by calling `confirmDelivery(uint256 _transactionId)` on the smart contract.
    *   **Smart Contract Interaction:**
        *   **Contract:** `BlockrentV2.sol`
        *   **Functions:** `confirmReceipt(uint256 _transactionId)`, `confirmDelivery(uint256 _transactionId)`
        *   **Action:** Each function updates the respective `buyerConfirmed` or `sellerConfirmed` flag in the `Transaction` struct. Once both are confirmed, the `_completeTransaction` internal function is called.
            *   `_completeTransaction` transfers the `price` to the seller (minus platform fees to `feeRecipient`) and refunds the `deposit` to the buyer (if applicable).
            *   `_completeTransaction` updates user reputation scores and emits a `TransactionCompleted` event.

5.  **Update Caches & Notify Users (Backend via Event Listener & Socket.io):**
    *   **Trigger:** The `TransactionCompleted` event is emitted by the `BlockrentV2` smart contract.
    *   **Action:** The `blockchainSync` service (`backend/services/blockchainSync.js`) listens for this event.
    *   **Backend Interaction:**
        *   **File:** `backend/services/blockchainSync.js`, `backend/routes/notifications.js` (potentially for pushing notifications).
        *   **Action:** The `blockchainSync` service updates the `transactions_cache` and possibly the `listings_cache` (e.g., if a listing was a sale and is now considered "sold").
        *   **Notification:** The backend (using `socket.io`) pushes real-time notifications to both the buyer and seller, informing them of the transaction's completion.
    *   **Tech:** `ethers.js` (event listening), `mysql2` (database update), `socket.io` (real-time notification).

6.  **User Feedback (Frontend):**
    *   **Trigger:** Transaction completion and/or real-time notification.
    *   **Action:** The frontend updates the user's dashboard (e.g., `frontend/src/pages/PurchasesPage.js`) to reflect the new transaction status and potentially prompts for a review.
    *   **Tech:** `Chakra UI`, React state updates.
#### 3.4. User Profile

**Goal:** To establish a persistent and comprehensive user profile that combines on-chain reputation and activity with off-chain metadata. This hybrid approach ensures that critical data is secure on the blockchain, while larger, non-critical data is stored efficiently off-chain.

**Flow & Data Storage:**

1.  **On-Chain Data (The Source of Truth):**
    *   **Structure:** The `BlockrentV2.sol` smart contract contains a `UserProfile` struct for each user, mapped by their wallet address: `mapping(address => UserProfile) public userProfiles;`
    *   **Content:** The `UserProfile` struct holds essential, verifiable data:
        *   `wallet`: The user's primary wallet address.
        *   `ipfsHash`: A pointer to the off-chain metadata file on IPFS.
        *   `totalListings`, `completedTransactions`, `totalReviews`, `ratingSum`: On-chain counters that are automatically updated by other contract functions (`createListing`, `_completeTransaction`, `submitReview`). This provides a trustless record of a user's activity and reputation.
        *   `averageRating`: Calculated on-chain to prevent manipulation.
        *   `isVerified`: A boolean flag that can only be set by an admin, indicating a higher level of trust.
        *   `reputationScore`: A numerical score that algorithmically increases or decreases based on positive (e.g., completed transactions, high ratings) and negative (e.g., lost disputes) actions.
    *   **Creation:** A user's on-chain profile is automatically created the first time they interact with a key contract function (e.g., `createListing` or `createTransaction`) via the `_initializeUserProfile` internal function.
    *   **Tech:** `Solidity`.

2.  **Off-Chain Metadata (Flexibility & Richness):**
    *   **Storage:** Larger or less critical profile data is stored in a JSON file on **IPFS**. The `ipfsHash` in the on-chain `UserProfile` struct links to this file.
    *   **Content:** This can include data like:
        *   `displayName`
        *   `bio`
        *   `profilePictureUrl`
        *   `socialMediaLinks`
    *   **Tech:** `IPFS` / `web3.storage`.

3.  **Off-Chain Cached Data (Performance & Querying):**
    *   **Storage:** The backend maintains a `users` table in its **MySQL database**. This table serves as a high-performance cache of both on-chain and off-chain data.
    *   **Content:** It mirrors the on-chain data (`reputationScore`, `totalTransactions`, etc.) and the off-chain metadata (`displayName`, `bio`, etc.). It also stores the encrypted PII.
    *   **Synchronization:**
        *   The `blockchainSync.js` service listens for contract events like `UserProfileUpdated` to keep the cache in sync with on-chain changes.
        *   When a user updates their profile on the frontend, the backend API updates both the MySQL cache and the IPFS metadata file.
    *   **Tech:** `MySQL` (`mysql2`), `Express.js`.

**Update Process (Example: User updates their display name):**

1.  **User Edits Profile (Frontend):**
    *   **Trigger:** User navigates to the `SettingsPage` (`frontend/src/pages/SettingsPage.js`) and changes their display name in a form.
    *   **Action:** The frontend sends a `PUT` request to the backend's `/api/users/:walletAddress` endpoint with the new profile data.
    *   **Tech:** React, `Chakra UI`, `fetch` API.

2.  **Backend Processes Update:**
    *   **Trigger:** Backend receives the `PUT` request at `backend/routes/users.js`.
    *   **Action:**
        1.  The backend updates the user's `displayName` in the **MySQL** `users` table.
        2.  It fetches the user's existing profile metadata from **IPFS**, updates the `displayName` field in the JSON, and uploads the new version to IPFS, getting a `newIpfsHash`.
        3.  The backend then prepares a transaction to call the `updateProfile` function on the smart contract.
    *   **Tech:** `Express.js`, `mysql2`, `web3.storage`, `ethers.js`.

3.  **Smart Contract Update:**
    *   **Trigger:** The backend (acting as a relayer, or prompting the user to sign) calls the `updateProfile` function on the contract.
    *   **Smart Contract Interaction:**
        *   **Contract:** `BlockrentV2.sol`
        *   **Function:** `updateProfile(string memory _ipfsHash)`
        *   **Action:** The contract updates the `ipfsHash` for the user's `UserProfile` struct and emits a `UserProfileUpdated` event.
    *   **Tech:** `Solidity`.

4.  **Frontend Updates:**
    *   **Trigger:** The backend API call returns a success message.
    *   **Action:** The frontend UI is updated to show the new display name.
    *   **Tech:** React state.
#### 3.5. Add Multiple Wallets

**Goal:** Allow a user to link multiple Ethereum wallet addresses to a single Blockrent user account. This enables greater flexibility, allowing users to interact with the platform from different wallets while maintaining a unified identity and reputation.

**Flow:**

1.  **User Initiates Linking Process (Frontend):**
    *   **Trigger:** An authenticated user navigates to their settings or profile page (e.g., `frontend/src/pages/SettingsPage.js`) and clicks an "Add New Wallet" or "Link Wallet" button.
    *   **Action:** The frontend prompts the user to connect the *new* wallet address they wish to link, distinct from their currently authenticated primary wallet.
    *   **Tech:** React, `Chakra UI`, `useWeb3` hook's `connectWallet()`.

2.  **Generate Link Token (Frontend -> Backend):**
    *   **Trigger:** The new wallet is successfully connected, and the frontend has its address.
    *   **Action:** The frontend sends a `POST` request to the backend's `/api/auth/link-token` endpoint. This request is authenticated using the `sessionId` of the *primary* wallet.
    *   **Tech:** `fetch` API.
    *   **Backend Interaction:**
        *   **File:** `backend/routes/auth.js`
        *   **Action:** The backend generates a unique, short-lived `linkToken` associated with the primary wallet address and stores it in the **MySQL database**. This token is returned to the frontend.
        *   **Tech:** `express.js`, `mysql2`.

3.  **Sign Message with New Wallet (Frontend):**
    *   **Trigger:** The frontend receives the `linkToken`.
    *   **Action:** The frontend then prompts the user to sign a specific message (containing the `linkToken`) using the *new* wallet address. This is similar to the initial login process, generating a `signature`, `message`, and `nonce` for the *new* wallet.
    *   **Tech:** `ethers.js` `signer.signMessage()`.

4.  **Confirm Link (Frontend -> Backend):
    *   **Trigger:** The user successfully signs the message with the new wallet.
    *   **Action:** The frontend sends a `POST` request to the backend's `/api/auth/confirm-link` endpoint, providing the `linkToken`, the `newWalletAddress`, and the `signature`, `message`, and `nonce` generated by the new wallet.
    *   **Tech:** `fetch` API.

5.  **Backend Verification & Linking:**
    *   **Trigger:** The backend receives the `confirm-link` request (`backend/routes/auth.js`).
    *   **Action:**
        1.  The backend verifies the `linkToken` and retrieves the associated primary wallet.
        2.  It then verifies the `signature` from the `newWalletAddress` against the provided `message` and `nonce` (similar to login verification).
        3.  If all checks pass, the `newWalletAddress` is linked to the primary user account in the **MySQL database** (e.g., in a `user_wallets` table, or by associating multiple wallet IDs with a single user ID).
        4.  An activity log entry is created (`activityDB.logActivity`).
    *   **Tech:** `express.js`, `ethers.js` (signature verification), `mysql2` (database updates), `backend/services/authService.js`.

6.  **Frontend Updates:**
    *   **Trigger:** The backend confirms successful linking.
    *   **Action:** The frontend displays a success message and updates the user's profile view to show the newly linked wallet address.
    *   **Tech:** React state, `Chakra UI`.

**Security Considerations:**
*   **Unique Primary Wallet:** One wallet is designated as the primary for authentication and session management.
*   **Signature Verification:** All linking actions are cryptographically secured by wallet signatures.
*   **Token Expiration:** `linkToken`s are short-lived to prevent replay attacks.

### To Be Implemented

#### 3.6. Rating System
#### 3.7. Notification System

**Goal:** To provide users with timely, multi-channel notifications (in-app and email) for important events, with user-configurable preferences.

**Architecture Components:**

1.  **Notification Service (Backend):**
    *   **File:** A new `backend/services/notificationService.js`.
    *   **Responsibility:** This service will be the central hub for creating, storing, and dispatching all notifications.
    *   **Tech:** `Express.js`, `mysql2`.

2.  **Real-Time Push Channel (In-App):**
    *   **Technology:** `socket.io` will be used for instant in-app alerts.
    *   **Flow:** When `notificationService` is called, it will identify the user's `socket.id` (mapped to their wallet address upon login) and push a `new_notification` event directly to their client.

3.  **Email Push Channel:**
    *   **Technology:** An email-sending library like `Nodemailer` will be added to the backend. This will require an external SMTP provider (e.g., SendGrid, Mailgun) configured via environment variables.
    *   **Flow:** When `notificationService` is called, it will:
        1.  Check the user's notification preferences from their profile in the **MySQL database**.
        2.  If email is enabled for that event type, it will retrieve the user's email address from the encrypted PII store.
        3.  The email address is decrypted just-in-time for sending.
        4.  `Nodemailer` is used to format and send the email through the configured SMTP provider.

4.  **User Preferences (Frontend & Backend):**
    *   **Backend:** The `users` table in **MySQL** will be extended to include columns for notification preferences (e.g., `email_on_transaction`, `email_on_auction`).
    *   **Frontend:** The `SettingsPage` will include a new section with toggles allowing users to enable or disable different types of in-app and email notifications.

**Notification Trigger Points & Flow:**

*   **For Purchase Transactions:**
    *   **Trigger:** The `blockchainSync.js` service detects a `TransactionStarted` or `TransactionCompleted` event.
    *   **Action:** It calls `notificationService.sendTransactionUpdate(userAddress, details)`. The service then creates the notification in the DB, pushes a `socket.io` event, and (if preferences allow) sends an email.

*   **For Auction Updates:**
    *   **Trigger:** The `auctionService` (to be created) determines a user has been outbid or an auction is ending.
    *   **Action:** It calls `notificationService.sendAuctionUpdate(userAddress, details)`. The service creates the notification, pushes a `socket.io` event, and sends an email.

*   **For New Items in Marketplace (Digest):**
    *   **Trigger:** A scheduled job (e.g., a "cron job" using `node-cron` on the backend) runs periodically.
    *   **Action:** The job finds users subscribed to "new item" notifications, queries for new listings, and calls the `notificationService` to format and send a single "digest" email to each user.
    *   **Tech:** `node-cron` (or similar scheduling library).
#### 3.8. Fractional Ownership

**Goal:** To enable multiple users to collectively own a single physical asset on the Blockrent platform, represented by a fractionalized Non-Fungible Token (NFT). This allows for lower entry barriers for high-value items and shared responsibilities.

**Core Concept:** The physical asset is represented by a single NFT (ERC-721), which is then fractionalized into multiple ERC-20 tokens. Each ERC-20 token represents a share of ownership in the underlying ERC-721 NFT.

**Flow:**

1.  **Creating a Fractional Listing (Frontend & Smart Contract):**
    *   **Frontend:** The `CreateListing` page (`frontend/src/pages/CreateListing.js`) will be enhanced with an option for "Fractional Ownership". If selected, additional fields will appear: "Total Shares," "Price Per Share," and possibly "Minimum Purchase Shares."
    *   **Smart Contract:** This is a significant change, likely requiring a new smart contract or a substantial modification to `BlockrentV2.sol`.
        *   **Approach 1 (New Contract):** A new `FractionalAssetManager.sol` contract could be deployed for each fractionalized asset, which would then hold the ERC-721 token representing the physical asset and issue ERC-20 tokens representing its fractions.
        *   **Approach 2 (Integrated):** `BlockrentV2.sol` would be modified to support the creation and management of fractionalized ERC-7021 tokens. This would involve:
            *   **ERC-721 Minting:** A new ERC-721 token representing the physical asset is minted by the `BlockrentV2` contract (or a dedicated `BlockrentNFT.sol` contract). This NFT is then locked in an escrow mechanism.
            *   **ERC-20 Fractionalization:** A new ERC-20 token is then minted, representing the shares of this ERC-721. The `BlockrentV2` contract would manage the total supply of these ERC-20 tokens and track their ownership.
        *   **Function:** `createFractionalListing(uint256 _totalShares, uint256 _pricePerShare, string memory _ipfsHash)`
        *   **Action:** This function would mint the ERC-721, create the associated ERC-20 shares, and set up the fractional listing parameters. An `FractionalListingCreated` event would be emitted.

2.  **Purchasing Shares (Frontend & Smart Contract):**
    *   **Frontend:** On a fractional listing's detail page, users would see the total shares, available shares, price per share, and an input for "Number of Shares to Buy."
    *   **Smart Contract:** A new `payable` function, `buyShares`, would be added.
        *   **Function:** `buyShares(uint256 _listingId, uint256 _numberOfShares)`
        *   **Action:**
            *   Requires `msg.value` to cover `_numberOfShares * pricePerShare`.
            *   Transfers the appropriate amount of ERC-20 tokens (shares) to the buyer.
            *   Updates the total available shares for the listing.
            *   A `SharesPurchased` event is emitted.

3.  **Managing Fractional Ownership (Frontend & Smart Contract):**
    *   **Frontend:** A dedicated "My Fractional Assets" dashboard would display all fractionalized assets a user owns, their percentage of ownership, and potentially options to sell shares or participate in governance related to the asset.
    *   **Smart Contract:** Additional functions would be needed for:
        *   `sellShares(uint256 _listingId, uint256 _numberOfShares)`: Allows owners to sell their shares back into a pool or to other users.
        *   **Governance (Optional):** If governance is desired (e.g., voting on renting out the asset), this would require further smart contract logic (e.g., a mini-DAO per asset).

4.  **Backend Caching & Synchronization:**
    *   **Backend:** New tables in **MySQL** would be needed to cache fractional listings, share ownership, and related metadata.
    *   `blockchainSync.js` would listen for all new fractional-related events (`FractionalListingCreated`, `SharesPurchased`, etc.) to keep the off-chain cache synchronized.

**New/Modified Components:**

*   **Smart Contract (`BlockrentV2.sol` or new contracts):**
    *   Integration of ERC-721 and ERC-20 standards (likely using OpenZeppelin implementations).
    *   New `FractionalListing` struct (or modifications to `Listing`).
    *   New functions: `createFractionalListing`, `buyShares`, `sellShares`.
    *   New events: `FractionalListingCreated`, `SharesPurchased`, `SharesTransferred`.
*   **Backend (`/backend`):**
    *   New `fractional_listings` and `share_ownership` tables in **MySQL**.
    *   `blockchainSync.js` extended to handle fractional ownership events.
    *   New `backend/routes/fractional.js` for API endpoints to query fractional data.
*   **Frontend (`/frontend`):**
    *   `CreateListing.js`: UI updates for fractional listing creation.
    *   `Marketplace.js`: UI to distinguish fractional listings.
    *   New `FractionalListingDetailPage.js` for purchasing and managing shares.
    *   New "My Fractional Assets" dashboard page.
#### 3.9. Auction System (Buy Only)

**Goal:** To allow users to list items for **sale** via an auction mechanism (buy only), where other users can place bids within a set time frame. The highest bidder at the end of the auction wins and can claim the item. This system does NOT support rental auctions.

**Flow:**

1.  **Creating an Auction Listing (Frontend & Smart Contract):**
    *   **Frontend:** The `CreateListing` page (`frontend/src/pages/CreateListing.js`) will be modified with a new "Auction" option. If selected, it will show fields for "Starting Price," "Minimum Bid Increment," and "Auction Duration" instead of a fixed price.
    *   **Smart Contract:** A new function, `createAuctionListing`, will be added to `BlockrentV2.sol`.
        *   **Function:** `createAuctionListing(uint256 _listingId, uint256 _startingPrice, uint256 _duration, uint256 _minBidIncrement, string memory _ipfsHash)` (Assuming `_listingId` is created first as a regular listing, then converted to auction type, or the listing creation logic needs to be integrated)
        *   **Action:** This will create a new `Auction` struct. The `Auction` struct would contain `seller`, `listingId`, `startingPrice`, `highestBid`, `highestBidder`, `startTime`, `endTime`, `minBidIncrement`, and a `state` (e.g., `OPEN`, `CLOSED`, `CANCELLED`). An `AuctionCreated` event would be emitted.

2.  **Placing a Bid (Frontend & Smart Contract):**
    *   **Frontend:** On an auction listing's detail page (a new `AuctionDetailPage.js` or modified `ViewDetailsModal`), an authenticated user will see the current highest bid, the remaining time, and a "Place Bid" input field and button.
    *   **Smart Contract:** A new `payable` function, `placeBid`, will be added.
        *   **Function:** `placeBid(uint256 _listingId)`
        *   **Action:**
            *   Requires that the auction is still `OPEN`.
            *   Requires `msg.value` to be higher than the current `highestBid` by at least `minBidIncrement`.
            *   The previous `highestBidder`'s bid is refunded to them.
            *   The new `msg.value` is held in escrow by the contract.
            *   The `highestBid` and `highestBidder` are updated.
            *   A `BidPlaced` event is emitted.
    *   **Backend & Notifications:** The `blockchainSync` service (`backend/services/blockchainSync.js`) will listen for `BidPlaced` events. It will update the `auctions_cache` table with the new bid amount and use the `notificationService` to send an email and/or real-time alert to the previously outbid user.

3.  **Ending the Auction (Smart Contract):**
    *   **Trigger:** Anyone can call a new `endAuction` function after the `endTime` has passed. This is a common pattern to allow for decentralized execution.
    *   **Smart Contract:**
        *   **Function:** `endAuction(uint256 _listingId)`
        *   **Action:**
            *   Requires `block.timestamp` to be greater than `endTime`.
            *   Requires the auction to be `OPEN`.
            *   Sets the auction `state` to `CLOSED`.
            *   If there is a `highestBidder`, it automatically creates a new transaction for the item (similar to `createTransaction`), marking the `highestBidder` as the buyer. The funds already in escrow are used.
            *   If there are no bids, the listing becomes inactive or reverts to a standard listing.
            *   An `AuctionEnded` event is emitted.
    *   **Backend & Notifications:** The `blockchainSync` service listens for `AuctionEnded` and updates the `auctions_cache` and `listings_cache` tables accordingly. Notifications are sent to the seller and the winning bidder.

4.  **Claiming the Item:**
    *   The flow for the winning bidder to claim the item will follow the standard "Buy / Rent from Marketplace" confirmation process (3.3). The winning bidder and seller must both confirm the exchange to release the funds from the auction transaction.

**New/Modified Components:**

*   **Smart Contract (`BlockrentV2.sol`):
    *   New `Auction` struct.
    *   New mappings: `mapping(uint256 => Auction) public auctions;`
    *   New functions: `createAuctionListing`, `placeBid`, `endAuction`.
    *   New events: `AuctionCreated`, `BidPlaced`, `AuctionEnded`.
*   **Backend (`/backend`):
    *   New `auctions` table in **MySQL** to cache auction state.
    *   `blockchainSync.js` updated to listen for new auction events.
    *   `notificationService.js` leveraged for auction-specific notifications.
    *   Potentially a new `backend/routes/auctions.js` for fetching auction details and history.
*   **Frontend (`/frontend`):
    *   `CreateListing.js`: UI changes to support creating auctions (e.g., input for duration, minimum bid).
    *   `Marketplace.js`: UI to differentiate auction listings.
    *   New `AuctionDetailPage.js` (or modified `ViewDetailsModal`) to show auction status, bid history, and bidding controls.
#### 3.10. PII (Personally Identifiable Information) Collection

**Goal:** To balance user privacy with regulatory compliance and fraud prevention. This is achieved by implementing a risk-based PII collection system that is triggered only for high-value or suspicious transactions, rather than for all users. Anonymity is preserved for everyday use.

**Key Principles:**
*   **Privacy by Default:** Standard users are not required to provide PII for general browsing and small transactions.
*   **Trigger-Based Collection:** PII is only requested when a user's activity crosses a predefined risk threshold.
*   **Informed Consent:** When PII is required, the user is clearly informed why it is necessary for the transaction to proceed.
*   **Secure, Off-Chain Storage:** All collected PII is encrypted and stored in a secure, off-chain database. **No PII is ever stored on the blockchain.**

**Thresholds for PII Requirement:**
Based on common Anti-Money Laundering (AML) practices, the following thresholds are proposed:
*   **Single Transaction Threshold:** Any transaction (buy, rent, or auction payment) exceeding **$3,000 USD** (or its equivalent in cryptocurrency).
*   **Aggregate Threshold:** Any series of transactions by a single user that accumulates to over **$10,000 USD** within a 24-hour period.

**Flow:**

1.  **Optional PII Pre-Verification (Frontend):**
    *   **Trigger:** A user can voluntarily navigate to their `SettingsPage` to "pre-verify" their identity.
    *   **Action:** The user is presented with the `PiiConsentModal` (`frontend/src/components/PiiConsentModal.js`), explaining that providing PII is optional but will allow for seamless high-value transactions in the future. If they consent, they fill out the secure PII form.
    *   **Backend Storage:** The data is sent to a secure backend endpoint (`PUT /api/users/:walletAddress/pii`), encrypted, and stored in the **MySQL database**. The user's profile is flagged as `pii_verified`.

2.  **Mandatory PII Collection at Transaction Time (Frontend):**
    *   **Trigger:** A user attempts to execute a smart contract transaction (e.g., `createTransaction`, `placeBid`) that exceeds the **$3,000 single transaction threshold**.
    *   **Action:**
        1.  The frontend first calls a new backend endpoint (e.g., `GET /api/users/check-verification`) to see if the user is already `pii_verified`.
        2.  If not verified, the transaction is **halted**, and the `PiiConsentModal` is displayed, stating that verification is required for transactions over $3,000.
        3.  The user must complete the PII collection flow (as described in step 1) before they can proceed with the high-value transaction.
    *   **Tech:** React, `ethers.js` (to check transaction value before sending), `Chakra UI`, `fetch` API.

3.  **Suspicious Activity Monitoring (Backend):**
    *   **Trigger:** The `blockchainSync` service detects any `TransactionStarted` or `AuctionEnded` event on the blockchain.
    *   **Action:**
        1.  The service logs the transaction details in the `transactions_cache` table.
        2.  It then checks the transaction against the risk thresholds.
        3.  If a threshold is met, a new entry is created in a dedicated `suspicious_activity_log` table in the **MySQL database**. This entry logs the `transactionId`, `walletAddress`, `amount`, and the reason for the flag (e.g., 'SINGLE_TX_LIMIT_EXCEEDED').
    *   **Outcome:** This creates a secure, private, off-chain record that can be reviewed internally. If required for legal or regulatory reasons, this log can be used to identify the relevant user and their (encrypted) PII.
    *   **Tech:** `ethers.js` (event listening), `mysql2` (database write/query).

4.  **Secure Storage and Access:**
    *   The core storage mechanism remains consistent: All PII is encrypted using the Node.js `crypto` module and stored in a secure table in **MySQL**. Access is strictly limited and audited.

