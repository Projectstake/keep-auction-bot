export class AuctionState {
  static open = new AuctionState("open");

  constructor(name) {
    this.name = name;
  }

  toString() {
    return `AuctionState.${this.name}`;
  }
}

export class Auction {
  constructor(address) {
    this._address = address;
    this._state = AuctionState.open;
  }

  get address() {
    return this._address;
  }

  get state() {
    return this._state;
  }

  set state(state) {
    this._state = state;
  }
}
