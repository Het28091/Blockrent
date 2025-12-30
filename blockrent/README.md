# Blockrent Protocol

**Decentralized Peer-to-Peer Rental & Sales Marketplace**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-Production--Ready-green.svg)
![Stack](https://img.shields.io/badge/stack-Solidity%20%7C%20Node.js%20%7C%20React-blueviolet)

---

## 📋 Executive Summary

**Blockrent** is a hybrid decentralized application (dApp) engineered to eliminate intermediaries in the peer-to-peer (P2P) asset sharing economy. By leveraging Ethereum-based smart contracts for settlement and IPFS for immutable data storage, Blockrent provides a trustless infrastructure where users can rent or sell assets without relying on centralized authorities like Airbnb or eBay.

Unlike traditional platforms that extract 15-30% in fees and monopolize user data, Blockrent operates on a **Wallet-First Identity** model, ensuring users own their reputation and transaction history while reducing transaction costs to near-zero (gas + minimal platform sustainment).

---

## 📉 Industry Problem Statement

The current P2P marketplace landscape is plagued by structural inefficiencies:

1.  **Rent-Seeking Intermediaries:** Centralized platforms act as gatekeepers, charging exorbitant service fees to subsidize their corporate overhead, effectively taxing the peer-to-peer economy.
2.  **Trust & Counterparty Risk:** In traditional P2P transactions, one party assumes disproportionate risk (e.g., sending money before receiving goods). Existing escrow solutions are often slow, expensive, and regionally restricted.
3.  **Reputation Silos:** A user's high rating on one platform (e.g., Uber) does not translate to another (e.g., Airbnb). Users are locked into platforms to maintain their "trust capital."
4.  **Data Sovereignty:** User data, transaction history, and behavioral analytics are harvested and monetized by platforms without user consent or revenue sharing.

---

## 🛡️ The Blockrent Solution

Blockrent solves these issues through a **Trust-Minimization Architecture**:

### 1. Smart Contract Escrow (The Trust Engine)
Transactions are governed by the `BlockrentV2` smart contract. Funds are programmatically locked in on-chain escrow and only released when specific cryptographic conditions are met (e.g., Buyer Confirmation). This eliminates the need for a trusted third party to hold funds.

### 2. Immutable Reputation System
User ratings and reviews are hashed and pinned to IPFS, with references stored on-chain. This creates a portable, tamper-proof reputation score tied to the user's wallet address (Identity), not a specific corporate database.

### 3. Decentralized Dispute Resolution
In the event of a conflict, the protocol initiates a dispute flow where funds are frozen. Evidence is submitted via IPFS, and a decentralized arbitration mechanism (governed by protocol admins or DAO structures) resolves the conflict, ensuring fairness without platform bias.

### 4. Hybrid "Web2.5" Architecture
To solve the "Blockchain Usability Gap," Blockrent employs a hybrid stack:
*   **Settlement Layer (L1/L2):** Handles value transfer, ownership, and logic (Solidity).
*   **Data Availability (IPFS):** Handles heavy media and metadata to ensure censorship resistance.
*   **Indexing Layer (SQL Cache):** A Node.js backend listens to blockchain events and indexes them into a SQL database. This allows for instant search, filtering, and rapid UI loading (milliseconds vs. seconds) without compromising decentralization.

---

## 🏗️ Technical Architecture

### Smart Contracts (Solidity)
*   **`BlockrentV2.sol`**: The core protocol logic.
    *   **Reentrancy Guard**: Prevents exploit vectors during fund transfers.
    *   **State Machine**: Manages transaction lifecycles (`Active` -> `Confirmed` -> `Completed`/`Disputed`).
    *   **Pull-Payment Pattern**: Protects against denial-of-service attacks during withdrawals.

### Backend Services (Node.js)
*   **`BlockchainSyncService`**: A real-time event ingestion engine. It subscribes to RPC events (`ListingCreated`, `TransactionCompleted`) and updates the off-chain cache.
    *   *Resilience*: Features auto-recovery and block-height persistence to survive server restarts without data loss.
*   **`IPFSService`**: Sanitized gateway for pinning and fetching content, with built-in DoS protection (size limits, timeouts).

### Frontend Client (React)
*   **Web3 Identity**: Authentication is handled purely via Wallet signature (MetaMask). No passwords, no emails required for core functionality.
*   **Real-Time Sync**: Uses WebSockets to reflect on-chain state changes instantly in the UI.

---

## 🚀 Getting Started

### Prerequisites
*   Node.js v18+
*   MySQL 8.0+
*   MetaMask Browser Extension

### Quick Launch
We provide a unified PowerShell bootstrapper to handle ports, services, and deployment.

```powershell
# Starts Blockchain, Backend, Frontend, and Deploys Contracts
.\start_project.ps1
```

Access the platform:
*   **Frontend:** [http://localhost:3001](http://localhost:3001)
*   **Backend API:** [http://localhost:5000](http://localhost:5000)

### Graceful Shutdown
```powershell
# Stops all services and cleans up zombie processes
.\stop_project.ps1
```

---

## 🔮 Future Roadmap

*   **Layer 2 Migration:** Deploying to Arbitrum/Optimism for sub-cent transaction fees.
*   **DAO Governance:** Transitioning the "Admin" role to a community-voting smart contract for dispute resolution and fee parameter setting.
*   **Identity Oracles:** Integration with Chainlink/DID to verify real-world identity (KYC) purely on-chain for high-value rentals (real estate, vehicles).

---

© 2024 Blockrent Protocol. Open Source Software.
