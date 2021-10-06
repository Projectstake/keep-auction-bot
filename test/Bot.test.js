const { expect } = require("chai");
const { ethers } = require("hardhat");

async function deployContracts() {
  const TBTCSystemMock = await ethers.getContractFactory("TBTCSystemMock");
  const tbtcSystem = await TBTCSystemMock.deploy();

  const DepositFactoryMock = await ethers.getContractFactory(
    "DepositFactoryMock"
  );
  const depositFactory = await DepositFactoryMock.deploy(tbtcSystem.address);

  const TBTCDepositTokenMock = await ethers.getContractFactory(
    "TBTCDepositTokenMock"
  );
  const tbtcDepositToken = await TBTCDepositTokenMock.deploy(
    depositFactory.address
  );

  const TestToken = await ethers.getContractFactory("TestToken");
  const tbtcToken = await TestToken.deploy();
  await tbtcToken.deployed();

  const UnderwriterToken = await ethers.getContractFactory("UnderwriterToken");
  const underwriterToken = await UnderwriterToken.deploy(
    "Underwriter Token",
    "COV"
  );
  await underwriterToken.deployed();

  const AssetPoolMock = await ethers.getContractFactory("AssetPoolMock");
  const assetPool = await AssetPoolMock.deploy(
    tbtcToken.address,
    underwriterToken.address
  );
  await assetPool.deployed();

  const CoveragePoolMock = await ethers.getContractFactory("CoveragePoolMock");
  const coveragePool = await CoveragePoolMock.deploy(assetPool.address);
  await coveragePool.deployed();

  const AuctionMock = await ethers.getContractFactory("AuctionMock");
  const masterAuction = await AuctionMock.deploy();
  await masterAuction.deployed();

  const AuctionBidderMock = await ethers.getContractFactory(
    "AuctionBidderMock"
  );
  const auctionBidder = await AuctionBidderMock.deploy(coveragePool.address);
  await auctionBidder.deployed();

  const auctionLength = 86400; // 24h

  const RiskManagerV1Mock = await ethers.getContractFactory(
    "RiskManagerV1Mock"
  );
  const riskManager = await RiskManagerV1Mock.deploy(
    tbtcToken.address,
    tbtcDepositToken.address,
    coveragePool.address,
    masterAuction.address,
    auctionLength
  );
  await riskManager.deployed();

  var contracts = {
    riskManager: riskManager,
    auctionBidder: auctionBidder,
  };

  return contracts;
}

describe("Bot contract", () => {
  let owner;
  let beneficiary;
  let addr1;
  let addrs;
  let contracts;

  before(async () => {
    contracts = await deployContracts();
    [owner, beneficiary, addr1, ...addrs] = await ethers.getSigners();
  });

  beforeEach(async () => {
    const Bot = await ethers.getContractFactory("Bot");
    const bot = await Bot.deploy(
      contracts.riskManager.address,
      contracts.auctionBidder.address,
      beneficiary.address
    );
    await bot.deployed();
    contracts.bot = bot;
  });

  describe("initialization", () => {
    it("sets a RiskManager", async () => {
      expect(await contracts.bot.riskManager()).to.equal(
        contracts.riskManager.address
      );
    });

    it("sets an AuctionBidder", async () => {
      expect(await contracts.bot.bidder()).to.equal(
        contracts.auctionBidder.address
      );
    });

    it("sets a beneficiary account", async () => {
      expect(await contracts.bot.beneficiary()).to.equal(beneficiary.address);
    });

    it("sets an owner account", async () => {
      expect(await contracts.bot.owner()).to.equal(owner.address);
    });
  });

  describe("setBeneficiary", () => {
    it("fails if called by a non-owner account", async () => {
      await expect(
        contracts.bot.connect(addr1).setBeneficiary(addr1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("succeeds when called by the owner account", async () => {
      await expect(
        contracts.bot.connect(owner).setBeneficiary(addr1.address)
      ).to.not.be.revertedWith("Ownable: caller is not the owner");
    });

    it("sets a new beneficiary account", async () => {
      await contracts.bot.setBeneficiary(addr1.address);
      expect(addr1.address).to.equal(await contracts.bot.beneficiary());
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

    it("emits a ReceivedFunds event", async () => {
      const ethValue = ethers.utils.parseEther("1");
      await expect(
        await owner.sendTransaction({
          to: contracts.bot.address,
          value: ethValue,
        })
      ).to.emit(contracts.bot, "ReceivedFunds");
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
      await expect(contracts.bot.connect(addr1).withdraw()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("succeeds when called by the owner account", async () => {
      await expect(
        contracts.bot.connect(owner).withdraw()
      ).to.not.be.revertedWith("Ownable: caller is not the owner");
    });

    it("resets the balance to zero", async () => {
      await contracts.bot.withdraw();
      expect(await contracts.bot.getBalance()).to.equal(0);
    });

    it("emits a WithdrewFunds event", async () => {
      await expect(await contracts.bot.withdraw()).to.emit(
        contracts.bot,
        "WithdrewFunds"
      );
    });
  });
});
