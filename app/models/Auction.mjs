export class AuctionState {
  static open = new AuctionState("open");
  static active = new AuctionState("active");
  static closed = new AuctionState("closed");

  constructor(name) {
    this._name = name;
  }

  toString() {
    return `AuctionState.${this._name}`;
  }

  get name() {
    return this._name;
  }
}

export class Auction {
  constructor(address, token, amount) {
    this._address = address;
    this._token = token;
    this._amount = amount;
    this._state = AuctionState.open;
  }

  get address() {
    return this._address;
  }

  get token() {
    return this._token;
  }

  get amount() {
    return this._amount;
  }

  get state() {
    return this._state;
  }

  set amount(amount) {
    this._amount = amount;
  }

  set state(state) {
    this._state = state;
  }
}
