import hre from "hardhat";

async function deployContracts() {
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

  var contracts = {
    depositLogger: depositLogger,
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
      `  depositLogger: ${depositLogger.address}\n`
  );

  return contracts;
}

import { DepositStore } from "./models/DepositStore.mjs";
export const depositStore = new DepositStore();

const contracts = await deployContracts();

import { Bot } from "./models/Bot.mjs";
export const bot = new Bot(contracts);
