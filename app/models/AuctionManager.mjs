import { AuctionState } from "./Auction.mjs";
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
      async (
        currencyTokenAddress,
        currencyTokensDesired,
        auctionContractAddress,
        _event
      ) => {
        await this._auctionStore.create(
          auctionContractAddress,
          currencyTokenAddress,
          currencyTokensDesired
        );
      }
    );

    this._contract.on(
      "AuctionOfferTaken",
      async (
        auctionContractAddress,
        _auctionTakerAddress,
        _currencyTokenAddress,
        currencyTokensOffered,
        _collateralTokensReceived,
        _event
      ) => {
        let auction = await this._auctionStore.read(auctionContractAddress);
        await this._auctionStore.update(
          auctionContractAddress,
          auction.amount - currencyTokensOffered,
          AuctionState.active
        );
      }
    );

    this._contract.on(
      "AuctionClosed",
      async (auctionContractAddress, _event) => {
        // await this._auctionStore.update(
        //   auctionContractAddress,
        //   0,
        //   AuctionState.closed
        // );
        await this._auctionStore.destroy(auctionContractAddress);
      }
    );
  }
}
