const hre = require("hardhat");

async function main() {
  const MoonSwap = await hre.ethers.getContractFactory("MoonSwap");
  const moonSwap = await MoonSwap.deploy();
  console.log(moonSwap);
  await moonSwap.deployed();
  console.log("MoonSwap deployed to:", moonSwap.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
