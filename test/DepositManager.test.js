const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;

require = require("esm")(module);
const { deployContracts, deployBot } = require("../app/contracts.mjs");
const { DepositState } = require("../app/models/Deposit.mjs");
const { Bot } = require("../app/models/Bot.mjs");
require("../app/models/DepositStore.mjs");

const oneBtc = 100000000;

const DepositStates = {
  START: 0,
  AWAITING_SIGNER_SETUP: 1,
  AWAITING_BTC_FUNDING_PROOF: 2,
  FAILED_SETUP: 3,
  ACTIVE: 4,
  AWAITING_WITHDRAWAL_SIGNATURE: 5,
  AWAITING_WITHDRAWAL_PROOF: 6,
  REDEEMED: 7,
  COURTESY_CALL: 8,
  FRAUD_LIQUIDATION_IN_PROGRESS: 9,
  LIQUIDATION_IN_PROGRESS: 10,
  LIQUIDATED: 11,
};

describe("TBTCSystemMock", () => {
  let owner;
  let addr1;
  let contracts;

  before(async () => {
    owner = await ethers.getSigner(0);
    addr1 = await ethers.getSigner(1);
  });

  beforeEach(async () => {
    contracts = await deployContracts();
  });

  describe("initialize()", async () => {
    it("fails if called by a non-owner account", async () => {
      await expect(
        contracts.tbtcSystem
          .connect(addr1)
          .initialize(
            contracts.depositFactory.address,
            contracts.deposit.address,
            contracts.tbtcDepositToken.address
          )
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("succeeds when called by the owner account", async () => {
      await expect(
        contracts.tbtcSystem
          .connect(owner)
          .initialize(
            contracts.depositFactory.address,
            contracts.deposit.address,
            contracts.tbtcDepositToken.address
          )
      ).to.not.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});

describe("DepositFactoryMock", () => {
  let contracts;
  const oneBtc = 100000000;

  beforeEach(async () => {
    contracts = await deployContracts();
    await contracts.tbtcSystem.initialize(
      contracts.depositFactory.address,
      contracts.deposit.address,
      contracts.tbtcDepositToken.address
    );
  });

  describe("createDeposit()", async () => {
    it("emits a DepositCloneCreated event", async () => {
      await expect(
        await contracts.depositFactory.createDeposit(oneBtc, {
          value: 10,
        })
      ).to.emit(contracts.depositFactory, "DepositCloneCreated");
    });

    it("emits a Created event", async () => {
      await expect(
        await contracts.depositFactory.createDeposit(oneBtc, { value: 10 })
      ).to.emit(contracts.tbtcSystem, "Created");
    });

    it("emits a new address for the new Deposit", async () => {
      const depositAddress = await createDeposit(contracts);
      expect(ethers.utils.isAddress(depositAddress)).to.be.true;
    });

    it("sets Deposit state to 'AWAITING_BTC_FUNDING_PROOF'", async () => {
      const depositAddress = await createDeposit(contracts);
      const deposit = await attachDepositAddressToContract(
        contracts,
        depositAddress
      );
      expect(await deposit.currentState()).to.equal(
        DepositStates.AWAITING_BTC_FUNDING_PROOF
      );
    });
  });
});

describe("DepositMock", () => {
  let contracts;
  let deposit;

  beforeEach(async () => {
    contracts = await deployContracts();
    await contracts.tbtcSystem.initialize(
      contracts.depositFactory.address,
      contracts.deposit.address,
      contracts.tbtcDepositToken.address
    );
    const depositAddress = await createDeposit(contracts);
    deposit = await attachDepositAddressToContract(contracts, depositAddress);
  });

  context("when AWAITING_BTC_FUNDING_PROOF", async () => {
    describe("provideBTCFundingProof()", async () => {
      it("emits a Funding event", async () => {
        await expect(await deposit.provideBTCFundingProof()).to.emit(
          contracts.tbtcSystem,
          "Funded"
        );
      });

      it("sets Deposit state to 'ACTIVE'", async () => {
        const tx = await deposit.provideBTCFundingProof();
        await tx.wait();
        expect(await deposit.currentState()).to.equal(DepositStates.ACTIVE);
      });
    });
  });

  context("when FUNDED", async () => {
    beforeEach(async () => {
      await deposit.provideBTCFundingProof();
    });

    describe("notifyUndercollateralizedLiquidation()", async () => {
      it("emits a StartedLiquidation event", async () => {
        await expect(
          await deposit.notifyUndercollateralizedLiquidation()
        ).to.emit(contracts.tbtcSystem, "StartedLiquidation");
      });

      it("sets Deposit state to 'LIQUIDATION_IN_PROGRESS'", async () => {
        const tx = await deposit.notifyUndercollateralizedLiquidation();
        await tx.wait();
        expect(await deposit.currentState()).to.equal(
          DepositStates.LIQUIDATION_IN_PROGRESS
        );
      });
    });
  });

  context("in LIQUIDATION", async () => {
    beforeEach(async () => {
      await deposit.provideBTCFundingProof();
      await deposit.notifyUndercollateralizedLiquidation();
    });

    describe("purchaseSignerBondsAtAuction()", async () => {
      it("emits a Liquidated event", async () => {
        await expect(await deposit.purchaseSignerBondsAtAuction()).to.emit(
          contracts.tbtcSystem,
          "Liquidated"
        );
      });

      it("sets Deposit state to 'LIQUIDATED'", async () => {
        const tx = await deposit.purchaseSignerBondsAtAuction();
        await tx.wait();
        expect(await deposit.currentState()).to.equal(DepositStates.LIQUIDATED);
      });
    });
  });
});

describe("DepositManager", () => {
  let contracts;
  let depositStore;
  let depositContractInstanceAddress;
  let depositContractInstance;

  beforeEach(async () => {
    const beneficiary = await ethers.getSigner(1);
    const beneficiaryAddress = beneficiary.address;
    contracts = await deployBot(beneficiaryAddress);
    await contracts.tbtcSystem.initialize(
      contracts.depositFactory.address,
      contracts.deposit.address,
      contracts.tbtcDepositToken.address
    );

    const bot = new Bot(contracts);
    await bot.start();
    depositStore = bot.depositStore;
  });

  context("DepositMock 'Created' event", async () => {
    it("adds a new Deposit instance to the DepositStore", async () => {
      expect(await depositStore.count()).to.equal(0);
      await createDepositWithDelay(contracts);
      expect(await depositStore.count()).to.equal(1);
    });

    it("sets new Deposit instance state to 'initialized'", async () => {
      expect(await depositStore.count()).to.equal(0);
      await createDepositWithDelay(contracts);
      expect(await depositStore.count()).to.equal(1);
      let list = await depositStore.list();
      let deposit = list[0];
      expect(deposit.state).to.equal(DepositState.initialized);
    });

    it("sets new Deposit instance address to cloned address", async () => {
      let emittedAddress;
      contracts.tbtcSystem.on("Created", async (address, _block, _event) => {
        emittedAddress = address;
      });
      expect(await depositStore.count()).to.equal(0);
      await createDepositWithDelay(contracts);
      expect(await depositStore.count()).to.equal(1);
      let list = await depositStore.list();
      let deposit = list[0];
      expect(deposit.address).to.equal(emittedAddress);
    });
  });

  context("DepositMock 'Funded' event", async () => {
    beforeEach(async () => {
      depositContractInstanceAddress = await createDepositWithDelay(contracts);
      depositContractInstance = await attachDepositAddressToContract(
        contracts,
        depositContractInstanceAddress
      );
    });

    it("sets funded Deposit state to 'active'", async () => {
      expect(await depositStore.count()).to.equal(1);
      let list = await depositStore.list();
      let deposit = list[0];
      expect(deposit.state).to.equal(DepositState.initialized);
      await fundDepositWithDelay(depositContractInstance);
      expect(deposit.state).to.equal(DepositState.active);
    });
  });

  context("DepositMock 'StartedLiquidation' event", async () => {
    beforeEach(async () => {
      depositContractInstanceAddress = await createDepositWithDelay(contracts);
      depositContractInstance = await attachDepositAddressToContract(
        contracts,
        depositContractInstanceAddress
      );
      await fundDepositWithDelay(depositContractInstance);
    });

    it("sets active Deposit state to 'startedLiquidation'", async () => {
      expect(await depositStore.count()).to.equal(1);
      let list = await depositStore.list();
      let deposit = list[0];
      expect(deposit.state).to.equal(DepositState.active);
      await startDepositLiquidationWithDelay(depositContractInstance);
      expect(deposit.state).to.equal(DepositState.startedLiquidation);
    });

    it("calls the Bot contract to notify the RiskManager", async () => {
      expect(await depositStore.count()).to.equal(1);
      let list = await depositStore.list();
      let deposit = list[0];
      expect(deposit.state).to.equal(DepositState.active);
      await startDepositLiquidationWithDelay(depositContractInstance);
      expect(deposit.state).to.equal(DepositState.startedLiquidation);
      const filter = contracts.bot.filters.NotifiedStartedLiquidation(null);
      const eventList = await contracts.bot.queryFilter(
        filter,
        "latest",
        "latest"
      );
      const depositAddress = eventList[0].args[0];
      expect(eventList[0].event).to.equal("NotifiedStartedLiquidation");
      expect(depositAddress).to.equal(depositContractInstanceAddress);
    });
  });

  context("DepositMock 'Liquidated' event", async () => {
    beforeEach(async () => {
      depositContractInstanceAddress = await createDepositWithDelay(contracts);
      depositContractInstance = await attachDepositAddressToContract(
        contracts,
        depositContractInstanceAddress
      );
      await fundDepositWithDelay(depositContractInstance);
      await startDepositLiquidationWithDelay(depositContractInstance);
    });

    it("sets in-liquidation Deposit state to 'liquidated'", async () => {
      expect(await depositStore.count()).to.equal(1);
      let list = await depositStore.list();
      let deposit = list[0];
      expect(deposit.state).to.equal(DepositState.startedLiquidation);
      await completeDepositLiquidationWithDelay(depositContractInstance);
      expect(deposit.state).to.equal(DepositState.liquidated);
      expect(await depositStore.count()).to.equal(0);
    });

    it("calls the Bot contract to notify the RiskManager", async () => {
      expect(await depositStore.count()).to.equal(1);
      let list = await depositStore.list();
      let deposit = list[0];
      expect(deposit.state).to.equal(DepositState.startedLiquidation);
      await completeDepositLiquidationWithDelay(depositContractInstance);
      expect(deposit.state).to.equal(DepositState.liquidated);
      const filter = contracts.bot.filters.NotifiedLiquidated(null);
      const eventList = await contracts.bot.queryFilter(
        filter,
        "latest",
        "latest"
      );
      const depositAddress = eventList[0].args[0];
      expect(eventList[0].event).to.equal("NotifiedLiquidated");
      expect(depositAddress).to.equal(depositContractInstanceAddress);
    });
  });
});

async function parseDepositAddressFromLog(contracts) {
  const filter = contracts.tbtcSystem.filters.Created(null, null);
  const eventList = await contracts.tbtcSystem.queryFilter(
    filter,
    "latest",
    "latest"
  );
  const event = eventList[0];
  const depositAddress = event.args[0];
  return depositAddress;
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

// This group of _WithDelay() functions call a contract method, then delay a
// few seconds for ethers.js to poll for events. Ethers.js polls at an interval
// of four seconds by default.
// Ref: https://github.com/nomiclabs/hardhat/issues/1692#issuecomment-904904674
async function createDepositWithDelay(contracts) {
  const milliseconds = 4200;
  const tx = await contracts.depositFactory.createDeposit(oneBtc, {
    value: 10,
  });
  await tx.wait();
  await sleep(milliseconds);
  return parseDepositAddressFromLog(contracts);
}
async function fundDepositWithDelay(deposit) {
  const milliseconds = 4200;
  const tx = await deposit.provideBTCFundingProof();
  await tx.wait();
  await sleep(milliseconds);
}
async function startDepositLiquidationWithDelay(deposit) {
  const milliseconds = 4200;
  const tx = await deposit.notifyUndercollateralizedLiquidation();
  await tx.wait();
  await sleep(milliseconds);
}
async function completeDepositLiquidationWithDelay(deposit) {
  const milliseconds = 4200;
  const tx = await deposit.purchaseSignerBondsAtAuction();
  await tx.wait();
  await sleep(milliseconds);
}

async function createDeposit(contracts) {
  const tx = await contracts.depositFactory.createDeposit(oneBtc, {
    value: 10,
  });
  await tx.wait();
  return parseDepositAddressFromLog(contracts);
}

async function attachDepositAddressToContract(contracts, address) {
  return await contracts.DepositMock.attach(address);
}
