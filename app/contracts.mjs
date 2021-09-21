import hre from "hardhat";

export async function deployContracts() {
  const DepositStatesMock = await hre.ethers.getContractFactory(
    "DepositStatesMock"
  );
  const depositStates = await DepositStatesMock.deploy();

  const OutsourceDepositLoggingMock = await hre.ethers.getContractFactory(
    "OutsourceDepositLoggingMock"
  );
  const depositLogging = await OutsourceDepositLoggingMock.deploy();

  const DepositFundingMock = await hre.ethers.getContractFactory(
    "DepositFundingMock",
    {
      libraries: {
        DepositStatesMock: depositStates.address,
        OutsourceDepositLoggingMock: depositLogging.address,
      },
    }
  );
  const depositFunding = await DepositFundingMock.deploy();

  const DepositLiquidationMock = await hre.ethers.getContractFactory(
    "DepositLiquidationMock",
    {
      libraries: {
        DepositStatesMock: depositStates.address,
        OutsourceDepositLoggingMock: depositLogging.address,
      },
    }
  );
  const depositLiquidation = await DepositLiquidationMock.deploy();

  const DepositMock = await hre.ethers.getContractFactory("DepositMock", {
    libraries: {
      DepositStatesMock: depositStates.address,
      DepositFundingMock: depositFunding.address,
      DepositLiquidationMock: depositLiquidation.address,
    },
  });
  const deposit = await DepositMock.deploy();

  const DepositUtilsMock = await hre.ethers.getContractFactory(
    "DepositUtilsMock"
  );
  const depositUtils = await DepositUtilsMock.deploy();

  const TBTCSystemMock = await hre.ethers.getContractFactory("TBTCSystemMock");
  const tbtcSystem = await TBTCSystemMock.deploy();

  const DepositFactoryMock = await hre.ethers.getContractFactory(
    "DepositFactoryMock"
  );
  const depositFactory = await DepositFactoryMock.deploy(tbtcSystem.address);

  const TBTCDepositTokenMock = await hre.ethers.getContractFactory(
    "TBTCDepositTokenMock"
  );
  const tbtcDepositToken = await TBTCDepositTokenMock.deploy(
    depositFactory.address
  );

  const DepositLogMock = await hre.ethers.getContractFactory("DepositLogMock");
  const depositLogger = await DepositLogMock.deploy();

  const TestToken = await hre.ethers.getContractFactory("TestToken");
  const tbtcToken = await TestToken.deploy();
  await tbtcToken.deployed();

  const UnderwriterToken = await hre.ethers.getContractFactory(
    "UnderwriterToken"
  );
  const underwriterToken = await UnderwriterToken.deploy(
    "Underwriter Token",
    "COV"
  );
  await underwriterToken.deployed();

  const AssetPoolMock = await hre.ethers.getContractFactory("AssetPoolMock");
  const assetPool = await AssetPoolMock.deploy(
    tbtcToken.address,
    underwriterToken.address
  );
  await assetPool.deployed();

  const CoveragePoolMock = await hre.ethers.getContractFactory(
    "CoveragePoolMock"
  );
  const coveragePool = await CoveragePoolMock.deploy(assetPool.address);
  await coveragePool.deployed();

  const AuctionMock = await hre.ethers.getContractFactory("AuctionMock");
  const masterAuction = await AuctionMock.deploy();
  await masterAuction.deployed();

  const AuctionBidderMock = await hre.ethers.getContractFactory(
    "AuctionBidderMock"
  );
  const auctionBidder = await AuctionBidderMock.deploy(coveragePool.address);
  await auctionBidder.deployed();

  const AuctioneerMock = await hre.ethers.getContractFactory("AuctioneerMock");
  const auctioneer = await AuctioneerMock.deploy(
    coveragePool.address,
    masterAuction.address
  );
  await auctioneer.deployed();

  const auctionLength = 86400; // 24h

  const RiskManagerV1Mock = await hre.ethers.getContractFactory(
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
    depositLogger: depositLogger,
    auctionLogger: auctioneer,
    riskManager: riskManager,
    auctionBidder: auctionBidder,
  };

  console.debug(
    `Initializing TBTCSystem [${tbtcSystem.address}] with:\n` +
      `  depositStates: ${depositStates.address}\n` +
      `  depositFunding: ${depositFunding.address}\n` +
      `  depositLiquidation: ${depositLiquidation.address}\n` +
      `  depositUtils: ${depositUtils.address}\n` +
      `  depositFactory: ${depositFactory.address}\n` +
      `  masterDepositAddress: ${deposit.address}\n` +
      `  tbtcDepositToken: ${tbtcDepositToken.address}\n` +
      `  depositLogger: ${depositLogger.address}\n` +
      `  auctionLogger: ${auctioneer.address}\n` +
      `  riskManager: ${riskManager.address}\n` +
      `  auctionBidder: ${auctionBidder.address}\n`
  );

  return contracts;
}
