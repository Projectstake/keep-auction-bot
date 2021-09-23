import { expect } from "chai";
import { Auction } from "../../app/models/Auction.mjs";
import { auctionStore } from "../../app/app.mjs";

describe("AuctionStore", function () {
  before(async function () {
    await auctionStore.create("1");
    await auctionStore.create("2");
    await auctionStore.create("3");
  });
  describe("list", function () {
    it("should return an array of Auctions", async function () {
      var list = await auctionStore.list();
      expect(list).to.be.instanceOf(Array);
      expect(list.length).to.equal(3);
    });
  });
  describe("count", function () {
    it("should return the number of Auctions", async function () {
      expect(await auctionStore.count()).to.equal(3);
    });
  });
  describe("create", function () {
    it("should return a Auction instance", async function () {
      var auction = await auctionStore.create("0");
      expect(auction).to.be.instanceOf(Auction);
    });
  });
  describe("read", function () {
    it("should return a Auction instance", async function () {
      var auctionA = await auctionStore.create("0");
      var auctionB = await auctionStore.read(auctionA.address);
      expect(auctionB).to.equal(auctionA);
      expect(auctionB).to.be.instanceOf(Auction);
    });
  });
  describe("destroy", function () {
    it("should remove a Auction from the store", async function () {
      var auction = await auctionStore.create("0");
      expect(await auctionStore.count()).to.equal(4);
      await auctionStore.destroy(auction.address);
      expect(await auctionStore.count()).to.equal(3);
    });
  });
  after(async function () {
    const auctions = await auctionStore.list();
    for (let auction of auctions) {
      await auctionStore.destroy(auction.address);
    }
  });
});
