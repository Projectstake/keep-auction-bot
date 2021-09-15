import { DepositManager } from "./DepositManager.mjs";

export class Bot {
  constructor(contracts) {
    this._depositManager = new DepositManager(contracts.depositLogger);
  }

  async start() {
    await this._depositManager.listen();
  }
}
