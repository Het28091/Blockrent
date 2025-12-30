# 🚀 How to Run Blockrent

Welcome to the Blockrent development team! This guide will help you set up the environment on your local machine.

## 🛠️ Prerequisites

1.  **Node.js** (v18 or higher)
    *   [Download Node.js](https://nodejs.org/)
2.  **MySQL Server** (v8.0)
    *   [Download MySQL](https://dev.mysql.com/downloads/installer/)
    *   *Important:* Remember your root password!
3.  **MetaMask** (Browser Extension)
    *   [Install MetaMask](https://metamask.io/)
4.  **PowerShell** (Pre-installed on Windows)

---

## 📥 Setup Instructions

### 1. Clone & Install
```powershell
# 1. Open Terminal in the project root
cd blockrent

# 2. Install all dependencies (Root, Backend, Frontend, Contracts)
# We have a script for this, but manually it is:
npm install
cd backend; npm install; cd ..
cd frontend; npm install; cd ..
cd contracts; npm install; cd ..
```

### 2. Configure Environment Variables
You will see `.env.example` files in each directory. You need to create real `.env` files.

**Backend (`backend/.env`):**
1.  Copy `backend/.env.example` to `backend/.env`.
2.  Update `DB_PASSWORD` with your local MySQL root password.
3.  Generate new secrets for `JWT_SECRET` and `SESSION_SECRET` (instructions in the file).

**Frontend (`frontend/.env`):**
1.  Copy `frontend/.env.example` to `frontend/.env`.
2.  No changes needed immediately; the contract address is auto-filled by the start script.

**Contracts (`contracts/.env`):**
1.  Copy `contracts/.env.example` to `contracts/.env`.
2.  The default key provided is for the local Hardhat test network. Keep it as is for dev.

### 3. Database Setup
Create the database and tables using the schema file.

```powershell
# Open MySQL Command Line or Workbench
mysql -u root -p < backend/database/schema.sql
```
*Note: Make sure the database name in `backend/.env` matches the one in `schema.sql` (default: `blockrent_db`).*

---

## ▶️ Running the Project

We have automated the complex startup process (Blockchain -> Deploy -> Backend -> Frontend).

**Simply run:**
```powershell
.\start_project.ps1
```

**This script will:**
1.  Kill any zombie processes on ports 3001, 5000, 8545.
2.  Start the **Hardhat Blockchain Node**.
3.  **Deploy** the `BlockrentV2` smart contract.
4.  **Sync** the new Contract Address to your `.env` files.
5.  **Sync** the ABIs to frontend/backend.
6.  Start the **Backend API**.
7.  Start the **Frontend App**.

**Access Points:**
*   Frontend: [http://localhost:3001](http://localhost:3001)
*   Backend API: [http://localhost:5000](http://localhost:5000)

---

## 🛑 Stopping the Project

To ensure all background processes are killed cleanly:

```powershell
.\stop_project.ps1
```

---

## 📈 Project Status & Implementation

**Current State: Production-Grade V2 Architecture**

### ✅ Completed / Implemented
*   **Authentication**: Wallet-based Login (MetaMask) with JWT sessions.
*   **Marketplace**: Create Listing (Sale/Rent), List View, Detail View.
*   **Transactions**:
    *   **Buy**: Full escrow flow (Payment -> Lock -> Delivery -> Release).
    *   **Rent**: Rental logic with deposits.
*   **User Profile**:
    *   Profile creation/editing.
    *   **Multi-Wallet**: Link multiple wallets to one identity.
*   **Reputation System**:
    *   **Contract**: Rating logic (`submitReview`) and Reputation Score storage.
    *   **Backend**: Event listeners for `ReviewSubmitted`.
    *   **Frontend**: UI integration needed.
*   **Dispute Resolution**:
    *   **Contract**: `createDispute` and `resolveDispute` flow fully coded.
    *   **Backend**: Dispute event tracking and database cache.
    *   **Frontend**: UI integration needed.
*   **Notifications**:
    *   Real-time WebSocket alerts for Sales, Purchases, and Disputes.

### 🚧 In Progress / To Do
1.  **UI Polish**: Connect the Dispute and Rating forms in the Frontend (Logic exists).
2.  **Fractional Ownership**: Not yet started.
3.  **Auction System**: Not yet started.
4.  **PII Compliance**: "Consent Modal" exists, but full encryption/GDPR export features need work.

---

**Note for Team:**
The `BlockrentV2.sol` contract and `blockchainSync.js` are the source of truth. If you change the contract, run `node scripts/update-abis.cjs` (or just restart the project using the start script) to ensure the Frontend/Backend ABIs are updated.
