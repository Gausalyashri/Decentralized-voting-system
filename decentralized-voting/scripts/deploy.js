const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const Voting = await ethers.getContractFactory("DecentralizedVoting");
  const voting = await Voting.deploy();
  await voting.waitForDeployment();

  const address = await voting.getAddress();
  console.log("DecentralizedVoting deployed to:", address);

  // Save address to file
  fs.writeFileSync("deployment.json", JSON.stringify({
    contractAddress: address,
    deployer: deployer.address,
    network: "localhost"
  }, null, 2));

  console.log("Deployment info saved to deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });