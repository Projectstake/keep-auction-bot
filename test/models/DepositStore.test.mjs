import { expect } from "chai";
import { DepositStore } from "../../app/models/DepositStore.mjs";
import { Deposit } from "../../app/models/Deposit.mjs";

var depositStore;

describe("DepositStore", function () {
  before(async function () {
    depositStore = new DepositStore();
    await depositStore.create("1");
    await depositStore.create("2");
    await depositStore.create("3");
  });
  describe("list", function () {
    it("should return an array of Deposits", async function () {
      var list = await depositStore.list();
      expect(list).to.be.instanceOf(Array);
      expect(list.length).to.equal(3);
    });
  });
  describe("count", function () {
    it("should return the number of Deposits", async function () {
      expect(await depositStore.count()).to.equal(3);
    });
  });
  describe("create", function () {
    it("should return a Deposit instance", async function () {
      var deposit = await depositStore.create("0");
      expect(deposit).to.be.instanceOf(Deposit);
    });
  });
  describe("read", function () {
    it("should return a Deposit instance", async function () {
      var depositA = await depositStore.create("0");
      var depositB = await depositStore.read(depositA.address);
      expect(depositB).to.equal(depositA);
      expect(depositB).to.be.instanceOf(Deposit);
    });
  });
  describe("destroy", function () {
    it("should remove a Deposit from the store", async function () {
      var deposit = await depositStore.create("0");
      expect(await depositStore.count()).to.equal(4);
      await depositStore.destroy(deposit.address);
      expect(await depositStore.count()).to.equal(3);
    });
  });
  after(async function () {
    const deposits = await depositStore.list();
    for (let deposit of deposits) {
      await depositStore.destroy(deposit.address);
    }
  });
});
