import hre from "hardhat";
const { ethers } = hre;

async function deployTBTCContracts(contracts) {
  const DepositStatesMock = await ethers.getContractFactory(
    "DepositStatesMock"
  );
  const depositStates = await DepositStatesMock.deploy();
  await depositStates.deployed();

  const OutsourceDepositLoggingMock = await ethers.getContractFactory(
    "OutsourceDepositLoggingMock"
  );
  const depositLogging = await OutsourceDepositLoggingMock.deploy();
  await depositLogging.deployed();

  const DepositFundingMock = await ethers.getContractFactory(
    "DepositFundingMock",
    {
      libraries: {
        DepositStatesMock: depositStates.address,
        OutsourceDepositLoggingMock: depositLogging.address,
      },
    }
  );
  const depositFunding = await DepositFundingMock.deploy();
  await depositFunding.deployed();

  const DepositLiquidationMock = await ethers.getContractFactory(
    "DepositLiquidationMock",
    {
      libraries: {
        DepositStatesMock: depositStates.address,
        OutsourceDepositLoggingMock: depositLogging.address,
      },
    }
  );
  const depositLiquidation = await DepositLiquidationMock.deploy();
  await depositLiquidation.deployed();

  const DepositUtilsMock = await ethers.getContractFactory("DepositUtilsMock");
  const depositUtils = await DepositUtilsMock.deploy();
  await depositUtils.deployed();

  const DepositMock = await ethers.getContractFactory("DepositMock", {
    libraries: {
      DepositStatesMock: depositStates.address,
      DepositFundingMock: depositFunding.address,
      DepositLiquidationMock: depositLiquidation.address,
      DepositUtilsMock: depositUtils.address,
    },
  });
  const deposit = await DepositMock.deploy();
  await deposit.deployed();

  const TBTCSystemMock = await ethers.getContractFactory("TBTCSystemMock");
  const tbtcSystem = await TBTCSystemMock.deploy();
  await tbtcSystem.deployed();

  const DepositFactoryMock = await ethers.getContractFactory(
    "DepositFactoryMock"
  );
  const depositFactory = await DepositFactoryMock.deploy(tbtcSystem.address);
  await depositFactory.deployed();

  const TBTCDepositTokenMock = await ethers.getContractFactory(
    "TBTCDepositTokenMock"
  );
  const tbtcDepositToken = await TBTCDepositTokenMock.deploy(
    depositFactory.address
  );
  await tbtcDepositToken.deployed();

  const DepositLogMock = await ethers.getContractFactory("DepositLogMock");
  const depositLogger = await DepositLogMock.deploy();
  await depositLogger.deployed();

  const TBTCToken = await ethers.getContractFactory("TBTCToken");
  const tbtcToken = await TBTCToken.deploy();
  await tbtcToken.deployed();

  contracts.deposit = deposit;
  contracts.depositLogging = depositLogging;
  contracts.depositFactory = depositFactory;
  contracts.depositLogger = depositLogger;
  contracts.tbtcToken = tbtcToken;
  contracts.tbtcDepositToken = tbtcDepositToken;
  contracts.tbtcSystem = tbtcSystem;
  contracts.DepositMock = DepositMock;

  return contracts;
}

async function deployCoveragePoolContracts(contracts) {
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

  const CollateralToken = await ethers.getContractFactory("CollateralToken");
  const collateralToken = await CollateralToken.deploy();
  await collateralToken.deployed();

  const UnderwriterToken = await ethers.getContractFactory("UnderwriterToken");
  const underwriterToken = await UnderwriterToken.deploy(
    "Underwriter Token",
    "COV"
  );
  await underwriterToken.deployed();

  const AssetPoolMock = await ethers.getContractFactory("AssetPoolMock");
  const assetPool = await AssetPoolMock.deploy(
    collateralToken.address,
    underwriterToken.address
  );
  await assetPool.deployed();

  const CoveragePoolMock = await ethers.getContractFactory("CoveragePoolMock");
  const coveragePool = await CoveragePoolMock.deploy(assetPool.address);
  await coveragePool.deployed();

  const AuctionMock = await ethers.getContractFactory("AuctionMock");
  const masterAuction = await AuctionMock.deploy();
  await masterAuction.deployed();

  const AuctioneerMock = await ethers.getContractFactory("AuctioneerMock");
  const auctioneer = await AuctioneerMock.deploy(
    coveragePool.address,
    masterAuction.address
  );
  await auctioneer.deployed();

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
    contracts.tbtcToken.address,
    tbtcDepositToken.address,
    coveragePool.address,
    masterAuction.address,
    auctionLength
  );
  await riskManager.deployed();

  contracts.collateralToken = collateralToken;
  contracts.riskManager = riskManager;
  contracts.auctionBidder = auctionBidder;
  contracts.auctioneer = auctioneer;

  return contracts;
}

export async function deployContracts() {
  let contracts = {};
  contracts = await deployTBTCContracts(contracts);
  contracts = await deployCoveragePoolContracts(contracts);
  return contracts;
}

export async function deployBot(beneficiaryAddress) {
  let contracts = await deployContracts();
  const Bot = await ethers.getContractFactory("Bot");
  const bot = await Bot.deploy(
    contracts.riskManager.address,
    contracts.auctionBidder.address,
    beneficiaryAddress
  );
  await bot.deployed();
  contracts.bot = bot;

  return contracts;
}
