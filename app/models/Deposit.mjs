export class DepositState {
  static initialized = new DepositState("initialized");
  static active = new DepositState("active");
  static startedLiquidation = new DepositState("startedLiquidation");
  static liquidated = new DepositState("liquidated");

  constructor(name) {
    this._name = name;
  }

  toString() {
    return `DepositState.${this._name}`;
  }

  get name() {
    return this._name;
  }
}

export class Deposit {
  constructor(address) {
    this._address = address;
    this._state = DepositState.initialized;
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
