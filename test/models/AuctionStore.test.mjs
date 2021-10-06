import { expect } from "chai";
import { Auction } from "../../app/models/Auction.mjs";
import { AuctionStore } from "../../app/models/AuctionStore.mjs";

describe("AuctionStore", () => {
  let auctionStore;

  before(async () => {
    auctionStore = new AuctionStore();
    await auctionStore.create("1");
    await auctionStore.create("2");
    await auctionStore.create("3");
  });
  describe("list", () => {
    it("should return an array of Auctions", async () => {
      var list = await auctionStore.list();
      expect(list).to.be.instanceOf(Array);
      expect(list.length).to.equal(3);
    });
  });
  describe("count", () => {
    it("should return the number of Auctions", async () => {
      expect(await auctionStore.count()).to.equal(3);
    });
  });
  describe("create", () => {
    it("should return a Auction instance", async () => {
      var auction = await auctionStore.create("0");
      expect(auction).to.be.instanceOf(Auction);
    });
  });
  describe("read", () => {
    it("should return a Auction instance", async () => {
      var auctionA = await auctionStore.create("0");
      var auctionB = await auctionStore.read(auctionA.address);
      expect(auctionB).to.equal(auctionA);
      expect(auctionB).to.be.instanceOf(Auction);
    });
  });
  describe("destroy", () => {
    it("should remove a Auction from the store", async () => {
      var auction = await auctionStore.create("0");
      expect(await auctionStore.count()).to.equal(4);
      await auctionStore.destroy(auction.address);
      expect(await auctionStore.count()).to.equal(3);
    });
  });
  after(async () => {
    const auctions = await auctionStore.list();
    for (let auction of auctions) {
      await auctionStore.destroy(auction.address);
    }
  });
});
