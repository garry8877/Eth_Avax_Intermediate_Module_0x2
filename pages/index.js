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

  const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
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
