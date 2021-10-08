import { Deposit } from "./Deposit.mjs";

export class DepositStore {
  constructor() {
    this._deposits = new Map();
  }

  async iterator() {
    return this._deposits.values();
  }

  async list() {
    return [...this._deposits.values()];
  }

  async count() {
    return this._deposits.size;
  }

  async create(address) {
    const deposit = new Deposit(address);
    this._deposits.set(deposit.address, deposit);
    return deposit;
  }

  async read(address) {
    if (this._deposits.has(address)) {
      return this._deposits.get(address);
    } else {
      throw new Error(`Deposit ${address} does not exist`);
    }
  }

  async update(address, state) {
    if (this._deposits.has(address)) {
      let deposit = this._deposits.get(address);
      deposit.state = state;
      return deposit;
    } else {
      throw new Error(`Deposit ${address} does not exist`);
    }
  }

  async destroy(address) {
    if (this._deposits.has(address)) {
      this._deposits.delete(address);
    } else {
      throw new Error(`Deposit ${address} does not exist`);
    }
  }
}
