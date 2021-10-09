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
      const accounts = await ethers.getSigners();
      const DummyErc20Out = await ethers.getContractFactory(
        "DummyERC20",
        accounts[1]
      );

      dummyErc20Out = await DummyErc20Out.deploy();
    });
  });

  const tokensIn = ethers.utils.parseUnits("1"); // 1 ether
  const tokensOut = ethers.utils.parseUnits("2"); // 2 ethers
  const swapId = 0;

  describe("createNewSwap()", function () {
    it("Approve inToken transfer", async function () {
      await dummyErc20In.approve(moonSwapV1.address, tokensIn);
    });
    it("Create a new swap", async function () {
      const accounts = await ethers.getSigners();
      await moonSwapV1.createNewSwap(
        dummyErc20In.address,
        dummyErc20Out.address,
        tokensIn,
        tokensOut,
        accounts[1].address
      );
    });
    it("Check if swap details are accurate", async function () {
      const accounts = await ethers.getSigners();
      const swapInfo = await moonSwapV1.swaps(swapId);
      await expect(swapInfo.inToken).to.equal(dummyErc20In.address);
      await expect(swapInfo.outToken).to.equal(dummyErc20Out.address);
      await expect(swapInfo.tokensIn).to.equal(
        tokensIn.sub(tokensIn.mul(5).div(1000))
      ); // tokensIn - 0.5% fee
      await expect(swapInfo.tokensOut).to.equal(tokensOut);
      await expect(swapInfo.inTokenParty).to.equal(accounts[0].address);
      await expect(swapInfo.outTokenParty).to.equal(accounts[1].address);
      await expect(swapInfo.status).to.equal(true);
    });
    it("Check token balance in escrow", async function () {
      const balance = await dummyErc20In.balanceOf(moonSwapV1.address);
      await expect(balance).to.equal(ethers.utils.parseUnits("1"));
    });
  });

  describe("commitToSwap()", function () {
    it("Approve outToken transfer", async function () {
      await dummyErc20Out.approve(moonSwapV1.address, tokensOut);
    });
    it("Commit unmatched amount", async function () {
      const accounts = await ethers.getSigners();
      const moonSwapV1Other = await moonSwapV1.connect(accounts[1]);
      await expect(
        moonSwapV1Other.commitToSwap(
          swapId,
          tokensOut.sub(ethers.utils.parseUnits("0.1"))
        )
      ).to.be.reverted;
    });
    it("Commit to existing swap", async function () {
      const accounts = await ethers.getSigners();
      const moonSwapV1Other = await moonSwapV1.connect(accounts[1]);
      await moonSwapV1Other.commitToSwap(swapId, tokensOut);
    });
    it("Check user account balances after swap", async function () {
      const accounts = await ethers.getSigners();
      await expect(
        dummyErc20Out.balanceOf(accounts[0].address),
        tokensOut.sub(tokensOut.mul(5).div(1000))
      );
      await expect(
        dummyErc20In.balanceOf(accounts[1].address),
        tokensIn.sub(tokensIn.mul(5).div(1000))
      );
    });
    it("Commit to non-existing swap", async function () {
      const accounts = await ethers.getSigners();
      const moonSwapV1Other = await moonSwapV1.connect(accounts[1]);
      await expect(moonSwapV1Other.commitToSwap(swapId + 1, tokensOut)).to.be
        .reverted;
    });
  });
});
