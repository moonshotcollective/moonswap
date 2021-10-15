// deploy/00_deploy_your_contract.js

const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, getChainId, deployments }) => {
  const frontendAddress = process.env.FRONTENDADDRESS;
  const receiverAddress = process.env.RECEIVERADDRESS;

  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();
  const deployerWallet = ethers.provider.getSigner();

  const confirmationRequirement = chainId === "31337" ? 1 : 3;

  await deploy("MoonSwap", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    // args: [ "Hello", ethers.utils.parseEther("1.5") ],
    log: true,
  });

  /*
    // Getting a previously deployed contract
    const YourContract = await ethers.getContract("YourContract", deployer);
    await YourContract.setPurpose("Hello");
  
    To take ownership of yourContract using the ownable library uncomment next line and add the 
    address you want to be the owner. 
    // yourContract.transferOwnership(YOUR_ADDRESS_HERE);

    //const yourContract = await ethers.getContractAt('YourContract', "0xaAC799eC2d00C013f1F11c37E654e59B0429DF6A") //<-- if you want to instantiate a version of a contract at a specific address!
  */

  /*
  //If you want to send value to an address from the deployer
  const deployerWallet = ethers.provider.getSigner()
  await deployerWallet.sendTransaction({
    to: "0x34aA3F359A9D614239015126635CE7732c18fDF3",
    value: ethers.utils.parseEther("0.001")
  })
  */

  /*
  //If you want to send some ETH to a contract on deploy (make your constructor payable!)
  const yourContract = await deploy("YourContract", [], {
  value: ethers.utils.parseEther("0.05")
  });
  */

  /*
  //If you want to link a library into your contract:
  // reference: https://github.com/austintgriffith/scaffold-eth/blob/using-libraries-example/packages/hardhat/scripts/deploy.js#L19
  const yourContract = await deploy("YourContract", [], {}, {
   LibraryName: **LibraryAddress**
  });
  */
  // run this if not for production deployment
  if (chainId !== "1") {
    // send test ETH to developer address on localhost
    const developerAddress = process.env.DEVELOPER;

    if (chainId === "31337" && developerAddress) {
      const devTransfer = await deployerWallet.sendTransaction({
        to: developerAddress,
        value: ethers.utils.parseEther("0.15"),
      });

      await devTransfer.wait(confirmationRequirement);
    }

    await deploy("dGTC", {
      from: deployer,
      log: true,
    });

    await deploy("dETH", {
      from: deployer,
      log: true,
    });
  }
};
module.exports.tags = ["MoonSwapV1"];
