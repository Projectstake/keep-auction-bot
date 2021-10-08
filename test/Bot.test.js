const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;

require = require("esm")(module);
const { deployBot } = require("../app/contracts.mjs");

describe("Bot contract", () => {
  let owner;
  let testSigner;
  let contracts;
  let beneficiaryAddress;

  before(async () => {
    owner = await ethers.getSigner(0);
    testSigner = await ethers.getSigner(1);
    const beneficiary = await ethers.getSigner(2);
    beneficiaryAddress = beneficiary.address;
  });

  beforeEach(async () => {
    contracts = await deployBot(beneficiaryAddress);
  });

  describe("initialization", () => {
    it("sets a RiskManager", async () => {
      expect(await contracts.bot.riskManager()).to.equal(
        contracts.riskManager.address
      );
    });

    it("sets an AuctionBidder", async () => {
      expect(await contracts.bot.auctionBidder()).to.equal(
        contracts.auctionBidder.address
      );
    });

    it("sets a beneficiary account", async () => {
      expect(await contracts.bot.beneficiaryAddress()).to.equal(
        beneficiaryAddress
      );
    });

    it("sets an owner account", async () => {
      expect(await contracts.bot.owner()).to.equal(owner.address);
    });
  });

  describe("setBeneficiary", () => {
    it("fails if called by a non-owner account", async () => {
      await expect(
        contracts.bot.connect(testSigner).setBeneficiary(testSigner.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("succeeds when called by the owner account", async () => {
      await expect(
        contracts.bot.connect(owner).setBeneficiary(testSigner.address)
      ).to.not.be.revertedWith("Ownable: caller is not the owner");
    });

    it("sets a new beneficiary account", async () => {
      await contracts.bot.setBeneficiary(testSigner.address);
      expect(testSigner.address).to.equal(
        await contracts.bot.beneficiaryAddress()
      );
    });
  });

  describe("funds reception", () => {
    it("increases the balance by the funding value", async () => {
      const ethValue = ethers.utils.parseEther("1");
      // console.log("Account balance:", (await owner.getBalance()).toString());
      await expect(
        await owner.sendTransaction({
          to: contracts.bot.address,
          value: ethValue,
        })
      ).to.changeEtherBalance(contracts.bot, ethValue);
      expect(await contracts.bot.getBalance()).to.equal(ethValue);
    });

    it("emits a ReceivedEther event", async () => {
      const ethValue = ethers.utils.parseEther("1");
      await expect(
        await owner.sendTransaction({
          to: contracts.bot.address,
          value: ethValue,
        })
      ).to.emit(contracts.bot, "ReceivedEther");
    });
  });

  describe("funds withdrawal", () => {
    beforeEach(async () => {
      const ethValue = ethers.utils.parseEther("1");
      await owner.sendTransaction({
        to: contracts.bot.address,
        value: ethValue,
      });
    });

    it("fails if called by a non-owner account", async () => {
      await expect(
        contracts.bot.connect(testSigner).withdrawEther()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("succeeds when called by the owner account", async () => {
      await expect(
        contracts.bot.connect(owner).withdrawEther()
      ).to.not.be.revertedWith("Ownable: caller is not the owner");
    });

    it("resets the balance to zero", async () => {
      await contracts.bot.withdrawEther();
      expect(await contracts.bot.getBalance()).to.equal(0);
    });

    it("emits a WithdrewEther event", async () => {
      await expect(await contracts.bot.withdrawEther()).to.emit(
        contracts.bot,
        "WithdrewEther"
      );
    });
  });
});
