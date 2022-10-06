const { ethers } = require('hardhat');
require('dotenv').config({ path: '.env' });
const { LINK_TOKEN, VRF_COORDINATOR, KEY_HASH, FEE } = require('../constants');

async function main() {
  const randomWinnerGame = await ethers.getContractFactory("RandomWinnerGame");

  const deployedRandomWinnerGameContract = await randomWinnerGame.deploy(
    VRF_COORDINATOR,
    LINK_TOKEN,
    KEY_HASH,
    FEE
  );

  await deployedRandomWinnerGameContract.deployed();

  console.log(
    "Verify Contract Address", 
    deployedRandomWinnerGameContract.address
  );
  // wait for etherscan to notice that the contract had been deployed
  console.log("Sleeping......");

  await sleep(30000);

  await hre.run("verify:verify", {
    address: deployedRandomWinnerGameContract.address,
    constructorArguments: [VRF_COORDINATOR, LINK_TOKEN, KEY_HASH, FEE],
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1)
  });