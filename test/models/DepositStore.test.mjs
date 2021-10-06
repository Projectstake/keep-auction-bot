import { expect } from "chai";
import { Deposit } from "../../app/models/Deposit.mjs";
import { DepositStore } from "../../app/models/DepositStore.mjs";

describe("DepositStore", () => {
  let depositStore;

  before(async () => {
    depositStore = new DepositStore();
    await depositStore.create("1");
    await depositStore.create("2");
    await depositStore.create("3");
  });
  describe("list", () => {
    it("should return an array of Deposits", async () => {
      var list = await depositStore.list();
      expect(list).to.be.instanceOf(Array);
      expect(list.length).to.equal(3);
    });
  });
  describe("count", () => {
    it("should return the number of Deposits", async () => {
      expect(await depositStore.count()).to.equal(3);
    });
  });
  describe("create", () => {
    it("should return a Deposit instance", async () => {
      var deposit = await depositStore.create("0");
      expect(deposit).to.be.instanceOf(Deposit);
    });
  });
  describe("read", () => {
    it("should return a Deposit instance", async () => {
      var depositA = await depositStore.create("0");
      var depositB = await depositStore.read(depositA.address);
      expect(depositB).to.equal(depositA);
      expect(depositB).to.be.instanceOf(Deposit);
    });
  });
  describe("destroy", () => {
    it("should remove a Deposit from the store", async () => {
      var deposit = await depositStore.create("0");
      expect(await depositStore.count()).to.equal(4);
      await depositStore.destroy(deposit.address);
      expect(await depositStore.count()).to.equal(3);
    });
  });
  after(async () => {
    const deposits = await depositStore.list();
    for (let deposit of deposits) {
      await depositStore.destroy(deposit.address);
    }
  });
});
