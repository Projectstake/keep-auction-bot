import { Auction } from "./Auction.mjs";

export class AuctionStore {
  constructor() {
    this.auctions = new Map();
  }

  async iterator() {
    return this.auctions.values();
  }

  async list() {
    return [...this.auctions.values()];
  }

  async count() {
    return this.auctions.size;
  }

  async create(address) {
    const auction = new Auction(address);
    this.auctions.set(auction.address, auction);
    return auction;
  }

  async read(address) {
    if (this.auctions.has(address)) {
      return this.auctions.get(address);
    } else {
      throw new Error(`Auction ${address} does not exist`);
    }
  }

  async update(address) {
    if (this.auctions.has(address)) {
      return this.auctions.get(address);
    } else {
      throw new Error(`Auction ${address} does not exist`);
    }
  }

  async destroy(address) {
    if (this.auctions.has(address)) {
      this.auctions.delete(address);
    } else {
      throw new Error(`Auction ${address} does not exist`);
    }
  }
}
