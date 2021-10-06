import "./AuctionStore.mjs";
import "./Bot.mjs";

export class AuctionManager {
  constructor(auctionStore, contract, bot) {
    this._auctionStore = auctionStore;
    this._contract = contract;
    this._bot = bot;
  }

  async listen() {
    this._contract.on(
      "AuctionCreated",
      async (tokenAddress, amount, auctionAddress) => {
        auction = await auctionStore.create(address);
      }
    );

    this._contract.on(
      "AuctionOfferTaken",
      async (
        auctionAddress,
        _takerAddress,
        _tokenAccepted,
        amount,
        _portionToSeize
      ) => {
        auction = await auctionStore.read(auctionAddress);
      }
    );

    this._contract.on("AuctionClosed", async (address) => {
      auction = await auctionStore.destroy(address);
    });
  }
}
