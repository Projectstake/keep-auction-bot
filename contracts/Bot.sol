// SPDX-License-Identifier: MIT

pragma solidity 0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IAuction.sol";
import "./interfaces/IAuctionBidder.sol";
import "./interfaces/IDeposit.sol";
import "./interfaces/IRiskManagerV1.sol";

/// @title Bot
/// @notice The auction bot contract that bids on deposit auctions.
contract Bot is Ownable {
    IRiskManagerV1 public immutable riskManager;
    IAuctionBidder public immutable bidder;

    // The Bot contract's beneficiary account. Withdrawn funds will be sent to
    // this account. The beneficiary account is set on contract deployment. A
    // new beneficiary account can be set with a call to setBeneficiary().
    address payable public beneficiary;

    // See https://github.com/keep-network/tbtc/blob/v1.1.0/solidity/contracts/deposit/DepositStates.sol
    enum DepositState {
        START,
        AWAITING_SIGNER_SETUP,
        AWAITING_BTC_FUNDING_PROOF,
        FAILED_SETUP,
        ACTIVE,
        AWAITING_WITHDRAWAL_SIGNATURE,
        AWAITING_WITHDRAWAL_PROOF,
        REDEEMED,
        COURTESY_CALL,
        FRAUD_LIQUIDATION_IN_PROGRESS,
        LIQUIDATION_IN_PROGRESS,
        LIQUIDATED
    }

    event ReceivedFunds(address, uint256);
    event WithdrewFunds(address, uint256);
    event NotifiedStartedLiquidation(address);
    event NotifiedLiquidated(address);

    modifier depositInLiquidation(address depositAddress) {
        IDeposit deposit = IDeposit(depositAddress);
        require(inLiquidation(deposit), "Deposit not in liquidation");
        _;
    }

    modifier depositIsLiquidated(address depositAddress) {
        IDeposit deposit = IDeposit(depositAddress);
        require(isLiquidated(deposit), "Deposit not liquidated");
        _;
    }

    function inLiquidation(IDeposit deposit) internal view returns (bool) {
        uint256 state = deposit.currentState();
        return (state == uint256(DepositState.FRAUD_LIQUIDATION_IN_PROGRESS) ||
            state == uint256(DepositState.LIQUIDATION_IN_PROGRESS));
    }

    function isLiquidated(IDeposit deposit) internal view returns (bool) {
        uint256 state = deposit.currentState();
        return state == uint256(DepositState.LIQUIDATED);
    }

    constructor(
        IRiskManagerV1 _riskManager,
        IAuctionBidder _bidder,
        address payable _beneficiary
    ) {
        riskManager = _riskManager;
        bidder = _bidder;
        beneficiary = _beneficiary;
    }

    function setBeneficiary(address payable _beneficiary) external onlyOwner {
        beneficiary = _beneficiary;
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        beneficiary.transfer(balance);
        emit WithdrewFunds(msg.sender, balance);
    }

    function handleDepositStartedLiquidation(address depositAddress)
        external
        onlyOwner
        depositInLiquidation(depositAddress)
    {
        riskManager.notifyLiquidation(depositAddress);
        emit NotifiedStartedLiquidation(depositAddress);
    }

    function handleDepositLiquidated(address depositAddress)
        external
        onlyOwner
        depositIsLiquidated(depositAddress)
    {
        riskManager.notifyLiquidated(depositAddress);
        emit NotifiedLiquidated(depositAddress);
    }

    receive() external payable {
        emit ReceivedFunds(msg.sender, msg.value);
    }
}
