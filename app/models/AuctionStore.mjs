import { Auction } from "./Auction.mjs";

export class AuctionStore {
  constructor() {
    this._auctions = new Map();
  }

  async iterator() {
    return this._auctions.values();
  }

  async list() {
    return [...this._auctions.values()];
  }

  async count() {
    return this._auctions.size;
  }

  async create(address, token, amount) {
    const auction = new Auction(address, token, amount);
    this._auctions.set(auction.address, auction);
    return auction;
  }

  async read(address) {
    if (this._auctions.has(address)) {
      return this._auctions.get(address);
    } else {
      throw new Error(`Auction ${address} does not exist`);
    }
  }

  async update(address, amount, state) {
    if (this._auctions.has(address)) {
      let auction = this._auctions.get(address);
      auction.amount = amount;
      auction.state = state;
      return auction;
    } else {
      throw new Error(`Auction ${address} does not exist`);
    }
  }

  async destroy(address) {
    if (this._auctions.has(address)) {
      this._auctions.delete(address);
    } else {
      throw new Error(`Auction ${address} does not exist`);
    }
  }
}
