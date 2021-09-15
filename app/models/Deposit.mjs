export class DepositState {
  static active = new DepositState("active");
  static enteredLiquidation = new DepositState("enteredLiquidation");
  static completedLiquidation = new DepositState("completedLiquidation");
  static exitedLiquidation = new DepositState("exitedLiquidation");

  constructor(name) {
    this.name = name;
  }

  toString() {
    return `DepositState.${this.name}`;
  }
}

export class Deposit {
  constructor(address) {
    this._address = address;
    this._state = DepositState.active;
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
