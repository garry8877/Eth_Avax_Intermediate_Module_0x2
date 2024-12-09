# Charity DApp - Introduction

Welcome to the **Charity Donation Platform**, a decentralized application (DApp) enabling users to donate funds securely, withdraw donations as the contract owner, and even refund their contributions if needed.

This DApp leverages Ethereum blockchain technology for transparent and efficient management of charitable contributions. Below is the detailed description of the project, including its functionalities and deployment instructions.

---

## Features

1. **Donate Funds**  
   Users can securely donate ETH to the charity smart contract.

2. **Withdraw Funds**  
   The contract owner can withdraw all funds from the contract balance.

3. **Refund Donations**  
   Donors can request refunds for their contributions at any time.

4. **Owner Management**  
   The contract owner can transfer ownership to another address.

5. **Transparent Operations**  
   The contract provides a view of:
   - Total donations.
   - Individual donor contributions.
   - Current contract balance.

---

## Smart Contract

### CharityFund.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

contract CharityFund {
    
    address public owner;
    uint256 public totalDonations;

    // Event to log donations
    event DonationReceived(address indexed donor, uint256 amount);
    event FundsWithdrawn(addre/*  */ss indexed owner, uint256 amount);
    event DonationRefunded(address indexed donor, uint256 amount);
    event OwnerChanged(address indexed oldOwner, address indexed newOwner);

   
    mapping(address => uint256) public donations;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function donate() external payable {
        require(msg.value > 0, "Donation must be greater than zero");

        donations[msg.sender] += msg.value;
        totalDonations += msg.value;

        emit DonationReceived(msg.sender, msg.value);
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        payable(owner).transfer(balance);

        emit FundsWithdrawn(owner, balance);
    }


    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getDonorContribution(address donor) external view returns (uint256) {
        return donations[donor];
    }

    function refundDonation() external {
        uint256 donatedAmount = donations[msg.sender];
        require(donatedAmount > 0, "No donations to refund");

        donations[msg.sender] = 0;
        totalDonations -= donatedAmount;

        payable(msg.sender).transfer(donatedAmount);
        emit DonationRefunded(msg.sender, donatedAmount);
    }

    function changeOwner(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner address");
        require(newOwner != owner, "New owner is the same as the current owner");

        address oldOwner = owner;
        owner = newOwner;

        emit OwnerChanged(oldOwner, newOwner);
    }
}
```

The `CharityFund` contract includes the following key functionalities:

- **donate()**: Allows users to send ETH to the contract.
- **withdraw()**: Enables the owner to withdraw all available funds.
- **getBalance()**: Returns the current contract balance.
- **getDonorContribution()**: Provides the total donations made by a specific address.
- **refundDonation()**: Refunds the donation of the caller.
- **changeOwner()**: Allows the owner to transfer contract ownership.

---

## CharityDapp - Frontend - 

```javascript
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import charity_abi from "../artifacts/contracts/CharityFund.sol/CharityFund.json";

export default function HomePage() {
  const [ethWallet, setEthWallet] = useState(undefined);
  const [account, setAccount] = useState(undefined);
  const [charity, setCharity] = useState(undefined);
  const [balance, setBalance] = useState(undefined);
  const [donationAmount, setDonationAmount] = useState("");
  const [refundAmount, setRefundAmount] = useState(undefined);
  const [newOwner, setNewOwner] = useState("");
  const [isOwner, setIsOwner] = useState(false);

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const charityABI = charity_abi.abi;

  const getWallet = async () => {
    if (window.ethereum) {
      setEthWallet(window.ethereum);
    }
  };

  const handleAccount = (accounts) => {
    if (accounts.length > 0) {
      setAccount(accounts[0]);
    } else {
      console.log("No account connected");
    }
  };

  const connectAccount = async () => {
    if (!ethWallet) {
      alert("Please install MetaMask to use this app.");
      return;
    }
    const accounts = await ethWallet.request({ method: "eth_requestAccounts" });
    handleAccount(accounts);
    getCharityContract();
  };

  const getCharityContract = () => {
    const provider = new ethers.providers.Web3Provider(ethWallet);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, charityABI, signer);
    setCharity(contract);
  };


  const getBalance = async () => {
    if (charity) {
      const balance = await charity.getBalance();
      setBalance(ethers.utils.formatEther(balance));
    }
  };

  const checkOwner = async () => {
    if (charity && account) {
      const owner = await charity.owner();
      setIsOwner(owner.toLowerCase() === account.toLowerCase());
    }
  };

  const donate = async () => {
    if (charity && donationAmount > 0) {
      try {
        const tx = await charity.donate({ value: ethers.utils.parseEther(donationAmount) });
        await tx.wait();
        alert(`Successfully donated ${donationAmount} ETH!`);
        setDonationAmount("");
        getBalance();
      } catch (error) {
        console.error("Donation Error:", error);
      }
    } else {
      alert("Please enter a valid donation amount.");
    }
  };

  const withdraw = async () => {
    if (charity && isOwner) {
      try {
        const tx = await charity.withdraw();
        await tx.wait();
        alert("Successfully withdrew all funds!");
        getBalance();
      } catch (error) {
        console.error("Withdraw Error:", error);
      }
    } else {
      alert("Only the owner can withdraw funds.");
    }
  };

  const refundDonation = async () => {
    if (charity) {
      try {
        const tx = await charity.refundDonation();
        await tx.wait();
        alert("Donation refunded successfully!");
        getBalance();
      } catch (error) {
        console.error("Refund Error:", error);
        alert("Failed to refund donation.");
      }
    }
  };

  const changeOwner = async () => {
    if (charity && isOwner && ethers.utils.isAddress(newOwner)) {
      try {
        const tx = await charity.changeOwner(newOwner);
        await tx.wait();
        alert(`Ownership transferred to ${newOwner}!`);
        setNewOwner("");
        checkOwner();
      } catch (error) {
        console.error("Ownership Change Error:", error);
        alert("Failed to change owner.");
      }
    } else {
      alert("Invalid address or you are not the owner.");
    }
  };

  const initUser = () => {
    if (!ethWallet) {
      return <p>Please install MetaMask to use this app.</p>;
    }

    if (!account) {
      return <button onClick={connectAccount}>Connect MetaMask Wallet</button>;
    }

    if (balance === undefined) {
      getBalance();
    }

    if (!isOwner) {
      checkOwner();
    }

    return (
      <div>
        <p>Your Account: {account}</p>
        <p>Contract Balance: {balance ? `${balance} ETH` : "Loading..."}</p>

        <div>
          <h3>Donate to the Charity</h3>
          <input
            type="number"
            value={donationAmount}
            onChange={(e) => setDonationAmount(e.target.value)}
            placeholder="Enter amount in ETH"
          />
          <button onClick={donate}>Donate</button>
        </div>

        {isOwner && (
          <>
            <div>
              <h3>Withdraw Funds (Owner Only)</h3>
              <button onClick={withdraw}>Withdraw All Funds</button>
            </div>
            <div>
              <h3>Change Contract Owner</h3>
              <input
                type="text"
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
                placeholder="New Owner Address"
              />
              <button onClick={changeOwner}>Change Owner</button>
            </div>
          </>
        )}

        <div>
          <h3>Refund Your Donation</h3>
          <button onClick={refundDonation}>Refund Donation</button>
        </div>
      </div>
    );
  };

  useEffect(() => {
    getWallet();
  }, []);

  return (
    <main className="container">
      <header>
        <h1>Welcome to the Charity Donation Platform!</h1>
      </header>
      {initUser()}
      <style jsx>{`
        .container {
          text-align: center;
          margin-top: 50px;
        }
        input {
          margin-right: 10px;
          padding: 5px;
        }
        button {
          padding: 10px 20px;
          margin-top: 10px;
          cursor: pointer;
        }
      `}</style>
    </main>
  );
}
```

The frontend is built using **React** and **ethers.js**, providing an intuitive interface for interacting with the smart contract. Key components include:

1. **Connection to MetaMask**  
   Users can connect their wallets for interaction.

2. **Donation Form**  
   A simple form to input the amount (in ETH) to donate.

3. **Owner Actions**  
   - Withdraw funds.
   - Change the contract owner.

4. **Refund Request**  
   Users can request refunds for their donations.

---

## Prerequisites

- **Node.js** and **npm**
- **MetaMask** extension installed in the browser
- **Remix** or a similar Solidity IDE for deploying the smart contract
- **Hardhat** for compiling and testing the contract (optional)

---

## Deployment Instructions

### 1. Deploying the Smart Contract

1. Open **Remix** and create a new file `CharityFund.sol`.
2. Paste the smart contract code into the file.
3. Compile the contract with Solidity version 0.8.17.
4. Deploy the contract on a test network (e.g., Goerli, Sepolia) or a local network using **MetaMask**.

### 2. Setting Up the Frontend

1. Clone this repository.
2. Navigate to the project directory:
   ```bash
   cd charity-dapp
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. execute hardhat commands to compile or deploy our smart contract on a blockchain network
5. Start the frontend:
   ```bash
   npm run dev
   ```

---

## Usage

1. **Connect Wallet**: Open the DApp and connect your MetaMask wallet.
2. **Donate**: Enter the donation amount in ETH and confirm the transaction.
3. **Withdraw (Owner Only)**: If you're the owner, withdraw all funds using the "Withdraw All Funds" button.
4. **Refund**: Request a refund of your donation if needed.
5. **Change Owner**: If you're the owner, transfer ownership to another address.

---

## Events

The contract emits the following events for transparency:
- **DonationReceived**: Logs donations.
- **FundsWithdrawn**: Logs fund withdrawals by the owner.
- **DonationRefunded**: Logs refunds to donors.
- **OwnerChanged**: Logs changes in ownership.

---

## Technologies Used

- **Solidity**: Smart contract language.
- **React.js**: Frontend framework.
- **Ethers.js**: Ethereum interaction library.
- **MetaMask**: Wallet integration.

---
