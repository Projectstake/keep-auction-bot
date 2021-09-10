import { Deposit } from "./Deposit.js";

export class DepositStore {
  constructor() {
    this.deposits = new Map();
  }

  async iterator() {
    return this.deposits.values();
  }

  async list() {
    return [...this.deposits.values()];
  }

  async count() {
    return this.deposits.size;
  }

  async create(address) {
    deposit = new Deposit(address);
    this.deposits.set(deposit.address, deposit);
  }

  async read(address) {
    if (this.deposits.has(address)) {
      return this.deposits.get(address);
    } else {
      throw new Error(`Deposit ${address} does not exist`);
    }
  }

  async update(address) {
    if (this.deposits.has(address)) {
      return this.deposits.get(address);
    } else {
      throw new Error(`Deposit ${address} does not exist`);
    }
  }

  async destroy(address) {
    if (this.deposits.has(address)) {
      this.deposits.delete(address);
    } else {
      throw new Error(`Deposit ${address} does not exist`);
    }
  }
}
