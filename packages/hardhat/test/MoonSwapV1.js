const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");

use(solidity);

describe("Test creating and committing to a swap", function () {
  let moonSwapV1;
  let dummyErc20In;
  let dummyErc20Out;

  describe("MoonSwapV1", function () {
    it("Should deploy MoonSwapV1", async function () {
      const MoonSwapV1 = await ethers.getContractFactory("MoonSwap");

      moonSwapV1 = await MoonSwapV1.deploy();
    });
  });

  describe("DummyERC20", function () {
    it("Should deploy DummyERC20 (inToken)", async function () {
      const DummyErc20In = await ethers.getContractFactory("DummyERC20");

      dummyErc20In = await DummyErc20In.deploy();
    });
  });

  describe("DummyERC20", function () {
    it("Should deploy DummyERC20 (outToken)", async function () {
      const DummyErc20Out = await ethers.getContractFactory("DummyERC20");

      dummyErc20Out = await DummyErc20Out.deploy();
    });
  });

  describe("createNewSwap()", function () {
    const tokensIn = ethers.utils.parseUnits("1"); // 1 ether
    const tokensOut = ethers.utils.parseUnits("2"); // 2 ethers
    it("Approve inToken transfer", async function () {
      await dummyErc20In.approve(
        moonSwapV1.address,
        ethers.utils.parseUnits("1")
      );
    });
    it("Create a new swap", async function () {
      const accounts = await hre.ethers.getSigners();
      await moonSwapV1.createNewSwap(
        dummyErc20In.address,
        dummyErc20Out.address,
        tokensIn,
        tokensOut,
        accounts[0].address
      );
    });
    it("Check if swap details are accurate", async function () {
      const accounts = await hre.ethers.getSigners();
      const swapInfo = await moonSwapV1.swaps(0);
      expect(swapInfo.inToken).to.equal(dummyErc20In.address);
      expect(swapInfo.outToken).to.equal(dummyErc20Out.address);
      expect(swapInfo.tokensIn).to.equal(
        tokensIn.sub(tokensIn.mul(5).div(1000))
      ); // tokensIn - 0.5% fee
      expect(swapInfo.tokensOut).to.equal(tokensOut);
      expect(swapInfo.inTokenParty).to.equal(accounts[0].address);
      expect(swapInfo.outTokenParty).to.equal(accounts[0].address);
      expect(swapInfo.status).to.equal(true);
    });
    it("Check token balance in escrow", async function () {
      const balance = await dummyErc20In.balanceOf(moonSwapV1.address);
      expect(balance).to.equal(ethers.utils.parseUnits("1"));
    });
  });
});
