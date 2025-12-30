# Blockrent Technical Manual & Code Walkthrough

This document provides a deep-dive technical analysis of the core files within the Blockrent architecture. It explains **why** specific files exist, what problems they solve, and details the logic of their critical sub-functions.

---

## 1. The Core Logic: `contracts/BlockrentV2.sol`

### 📄 Existence Rationale
This Solidity file is the "Supreme Court" and "Bank" of the application. In a traditional app, this logic would live in a private database and banking API. In Blockrent, this file exists to ensure **trustlessness**. Once deployed, its rules cannot be changed by the admins, ensuring users that their funds are handled exactly as programmed.

### ⚙️ Critical Sub-Functions

#### `createTransaction(uint256 _listingId)`
*   **Purpose:** Initiates the financial agreement between Buyer and Seller.
*   **Logic:**
    1.  Checks if the listing is active and if the buyer is not the seller (anti-wash trading).
    2.  **Payable:** It accepts ETH (or native token) equal to `price + deposit`.
    3.  **Escrow:** Funds are *not* sent to the seller yet. They are held by the contract address.
    4.  **Event:** Emits `TransactionStarted` so the backend knows to send a notification.

#### `_completeTransaction(uint256 _transactionId)`
*   **Purpose:** The settlement engine.
*   **Logic:**
    1.  **Checks:** Verifies funds exist in escrow.
    2.  **Effects:** Updates state to `COMPLETED` *before* sending money (prevents Reentrancy Attacks).
    3.  **Interactions:** Calculates the Platform Fee (2.5%), transfers it to the Admin, and sends the remaining funds to the Seller. Returns deposit to Buyer (if applicable).

#### `resolveDispute(uint256 _disputeId, address _winner)`
*   **Purpose:** The arbitration mechanism.
*   **Logic:**
    1.  Only callable by an `Admin` (governance layer).
    2.  Moves funds from the frozen escrow to the winning party.
    3.  Applies reputation penalties to the loser to discourage bad behavior.

---

## 2. The Bridge: `backend/services/blockchainSync.js`

### 📄 Existence Rationale
Blockchains are slow to query (reading thousands of listings takes minutes). SQL databases are fast (milliseconds). This file exists to **mirror** the blockchain state into a local MySQL database. It ensures the UI is snappy while the data remains decentralized.

### ⚙️ Critical Sub-Functions

#### `start(io)`
*   **Purpose:** The bootstrapper.
*   **Logic:**
    1.  Connects to the Ethereum node via RPC.
    2.  Loads the Smart Contract using the ABI.
    3.  Calls `syncHistoricalData()` to catch up on missed events.
    4.  Calls `setupEventListeners()` to listen for new events in real-time.

#### `syncHistoricalData()`
*   **Purpose:** The "Time Machine" recovery system.
*   **Logic:**
    1.  **Checkpointing:** Queries `system_settings` table for `last_synced_block`.
    2.  **Batching:** Fetches all events from `last_synced_block` to `current_block`.
    3.  **Processing:** Replays every event (e.g., creating listings, updating transactions) to ensure the database matches the blockchain perfectly.

#### `setupEventListeners()`
*   **Purpose:** Real-time ingestion.
*   **Logic:**
    1.  Subscribes to `ListingCreated`, `TransactionConfirmed`, etc.
    2.  On event:
        *   Fetches IPFS metadata (title, image).
        *   Updates MySQL.
        *   **Push:** Emits a WebSocket event (`io.emit`) so the Frontend updates instantly without the user refreshing.

---

## 3. The Gateway: `backend/services/ipfsService.js`

### 📄 Existence Rationale
Storing images and descriptions on the Blockchain is prohibitively expensive (hundreds of dollars per MB). This file exists to interface with **IPFS (InterPlanetary File System)**. It creates a cryptographic hash (CID) of the data, which is cheap to store on-chain.

### ⚙️ Critical Sub-Functions

#### `pinJSONToIPFS(jsonData)`
*   **Purpose:** Anchoring metadata.
*   **Logic:**
    1.  Takes a JavaScript Object (e.g., Listing Title, Description).
    2.  Uploads it to IPFS (via Pinata or NFT.Storage).
    3.  Returns the `ipfsHash` (CID) which is then sent to the Smart Contract.

#### `fetchFromIPFS(ipfsHash)`
*   **Purpose:** Safe data retrieval.
*   **Logic:**
    1.  **Security:** Implements a timeout (5000ms) and size limit (5MB).
    2.  **Reason:** Prevents "IPFS Bombs" (maliciously large files) from crashing the backend server.

---

## 4. The Client Identity: `frontend/src/context/Web3Context.js`

### 📄 Existence Rationale
In Web2, sessions are managed by cookies and passwords. In Web3, identity is the **Wallet**. This file exists to manage the connection state between the user's browser, the MetaMask extension, and the Blockchain.

### ⚙️ Critical Sub-Functions

#### `connectWallet()`
*   **Purpose:** Authentication.
*   **Logic:**
    1.  Detects `window.ethereum` (MetaMask).
    2.  Requests account access.
    3.  **Network Check:** Verifies the user is on the correct chain (Localhost/Mumbai). If not, it requests a network switch.
    4.  Instantiates the `ethers.Contract` object using the ABI, enabling the frontend to call smart contract functions.

---

## 5. The Orchestrator: `start_project.ps1`

### 📄 Existence Rationale
A decentralized stack is complex (Blockchain Node + API Server + React Frontend + Database). This script exists to **abstract complexity**. It turns a 10-step manual process into a single click for the developer.

### ⚙️ Critical Sub-Functions

#### `Ensure-PortFree(Port)`
*   **Purpose:** Hygiene and Stability.
*   **Logic:**
    1.  Checks if ports 8545, 5000, or 3001 are locked by "zombie" processes from a previous crash.
    2.  Force-kills them to ensure a clean startup.

#### `Start-ProcessBackground(...)`
*   **Purpose:** Service Management.
*   **Logic:**
    1.  Launches processes in hidden windows (to avoid clutter).
    2.  **Redirection:** Pipes `STDOUT` and `STDERR` to log files (`logs/backend.log`, etc.) instead of the console, making debugging easier.
    3.  Captures the **Process ID (PID)** and saves it to `.blockrent_pids.json` so the Stop script knows exactly what to kill later.

---

**End of Manual**
*Version 2.0 - Generated for Blockrent Architecture*
