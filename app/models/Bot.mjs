import { DepositStore } from "./DepositStore.mjs";
import { DepositManager } from "./DepositManager.mjs";
import { AuctionStore } from "./AuctionStore.mjs";
import { AuctionManager } from "./AuctionManager.mjs";

export class Bot {
  constructor(contracts) {
    this._contract = contracts.bot;
    this._depositStore = new DepositStore();
    this._auctionStore = new AuctionStore();
    this._depositManager = new DepositManager(
      this._depositStore,
      contracts.tbtcSystem,
      this
    );
    this._auctionManager = new AuctionManager(
      this._auctionStore,
      contracts.auctioneer,
      this
    );
  }

  async start() {
    await this._depositManager.listen();
    await this._auctionManager.listen();
  }

  async handleDepositStartedLiquidation(depositAddress) {
    this._contract.handleDepositStartedLiquidation(depositAddress);
  }

  async handleDepositLiquidated(depositAddress) {
    this._contract.handleDepositLiquidated(depositAddress);
  }

  async bid(auctionAddress, bidAmount, minCollateral) {
    this._contract.makeOffer(auctionAddress, bidAmount, minCollateral);
  }

  get depositStore() {
    return this._depositStore;
  }

  get auctionStore() {
    return this._auctionStore;
  }

  get depositManager() {
    return this._depositManager;
  }

  get auctionManager() {
    return this._auctionManager;
  }
}
