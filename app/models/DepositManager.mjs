import { DepositState } from "./Deposit.mjs";
import "./DepositStore.mjs";
import "./Bot.mjs";

export class DepositManager {
  constructor(depositStore, contract, bot) {
    this._depositStore = depositStore;
    this._contract = contract;
    this._bot = bot;
  }

  async listen() {
    this._contract.on(
      "Created",
      async (depositContractAddress, _timestamp, _event) => {
        await this._depositStore.create(depositContractAddress);
      }
    );

    this._contract.on(
      "Funded",
      async (depositContractAddress, _txid, _timestamp, _event) => {
        let deposit = await this._depositStore.read(depositContractAddress);
        deposit.state = DepositState.active;
      }
    );

    this._contract.on(
      "StartedLiquidation",
      async (depositContractAddress, _wasFraud, _timestamp, _event) => {
        let deposit = await this._depositStore.read(depositContractAddress);
        deposit.state = DepositState.startedLiquidation;
        this._bot.handleDepositStartedLiquidation(depositContractAddress);
      }
    );

    this._contract.on(
      "Liquidated",
      async (depositContractAddress, _timestamp, _event) => {
        let deposit = await this._depositStore.read(depositContractAddress);
        deposit.state = DepositState.liquidated;
        this._bot.handleDepositLiquidated(depositContractAddress);
        await this._depositStore.destroy(deposit.address);
      }
    );

    this._contract.on(
      "Redeemed",
      async (depositContractAddress, _txid, _timestamp, _event) => {
        let deposit = await this._depositStore.read(depositContractAddress);
        await this._depositStore.destroy(deposit.address);
      }
    );
  }
}
