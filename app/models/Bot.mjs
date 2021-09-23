import { DepositManager } from "./DepositManager.mjs";
import { AuctionManager } from "./AuctionManager.mjs";

export class Bot {
  constructor(contracts) {
    this._depositManager = new DepositManager(contracts.depositLogger);
    this._auctionManager = new AuctionManager(contracts.auctionLogger);
  }

  async start() {
    await this._depositManager.listen();
    await this._auctionManager.listen();
  }
}
