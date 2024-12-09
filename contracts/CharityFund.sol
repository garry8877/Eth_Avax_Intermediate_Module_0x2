// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

contract CharityFund {
    
    address public owner;
    uint256 public totalDonations;

    // Event to log donations
    event DonationReceived(address indexed donor, uint256 amount);
    event FundsWithdrawn(address indexed owner, uint256 amount);
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
