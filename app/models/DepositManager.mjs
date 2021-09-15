import { DepositStore } from "./DepositStore.mjs";
import { DepositState } from "./Deposit.mjs";

export class DepositManager {
  constructor(loggerContract) {
    this._loggerContract = loggerContract;
  }

  async listen() {
    this._loggerContract.on("Funded", async (address, _txid, _timestamp) => {
      deposit = await DepositStore.create(address);
    });
    this._loggerContract.on(
      "StartedLiquidation",
      async (address, _wasFraud, _timestamp) => {
        deposit = await DepositStore.read(address);
        deposit.state = DepositState.enteredLiquidation;
        // notify riskManager
      }
    );
    this._loggerContract.on("Liquidated", async (address, _timestamp) => {
      deposit = await DepositStore.read(address);
      deposit.state = DepositState.completedLiquidation;
      // notify riskManager
      await DepositStore.destroy(deposit.address);
    });
    this._loggerContract.on(
      "ExitedCourtesyCall",
      async (address, _timestamp) => {
        deposit = await DepositStore.read(address);
        deposit.state = DepositState.exitedLiquidation;
        // notify riskManager
        deposit.state = DepositState.active;
      }
    );
    this._loggerContract.on("Redeemed", async (address, _txid, _timestamp) => {
      deposit = await DepositStore.destroy(address);
    });

    console.log("Listening to tBTC deposit logs");
  }
}
