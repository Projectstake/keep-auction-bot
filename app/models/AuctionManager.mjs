import { auctionStore } from "../app.mjs";
import { AuctionState } from "./Auction.mjs";

export class AuctionManager {
  constructor(loggerContract) {
    this._loggerContract = loggerContract;
  }

  async listen() {
    this._loggerContract.on(
      "AuctionCreated",
      async (tokenAddress, amount, auctionAddress) => {
        auction = await auctionStore.create(address);
      }
    );
    this._loggerContract.on(
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
    this._loggerContract.on("AuctionClosed", async (address) => {
      auction = await auctionStore.destroy(address);
    });

    console.log("Listening to CoveragePool auction logs");
  }
}
