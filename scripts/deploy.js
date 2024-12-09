// Import the Hardhat Runtime Environment
const hre = require("hardhat");

async function main() {

  const Assessment = await hre.ethers.getContractFactory("CharityFund");
  const assessment = await Assessment.deploy();


  await assessment.deployed();

  console.log(`Contract Deployed Address: ${assessment.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
