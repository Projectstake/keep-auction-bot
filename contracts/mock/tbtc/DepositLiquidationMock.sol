// SPDX-License-Identifier: MIT

pragma solidity 0.8.4;

import {DepositStatesMock} from "./DepositStatesMock.sol";
import {DepositUtilsMock} from "./DepositUtilsMock.sol";
import {OutsourceDepositLoggingMock} from "./OutsourceDepositLoggingMock.sol";

library DepositLiquidationMock {
    using DepositUtilsMock for DepositUtilsMock.DepositMock;
    using DepositStatesMock for DepositUtilsMock.DepositMock;
    using OutsourceDepositLoggingMock for DepositUtilsMock.DepositMock;

    /// @dev              Starts signer liquidation by seizing signer bonds.
    ///                   If the deposit is currently being redeemed, the redeemer
    ///                   receives the full bond value; otherwise, a falling price auction
    ///                   begins to buy 1 TBTC in exchange for a portion of the seized bonds;
    ///                   see purchaseSignerBondsAtAuction().
    /// @param _wasFraud  True if liquidation is being started due to fraud, false if for any other reason.
    /// @param _d         Deposit storage pointer.
    function startLiquidation(
        DepositUtilsMock.DepositMock storage _d,
        bool _wasFraud
    ) internal {
        _d.logStartedLiquidation(_wasFraud);

        // If we see fraud in the redemption flow, we shouldn't go to auction.
        // Instead give the full signer bond directly to the redeemer.
        if (_d.inRedemption() && _wasFraud) {
            _d.setLiquidated();
            _d.logLiquidated();
            return;
        }

        if (_wasFraud) {
            _d.setFraudLiquidationInProgress();
        } else {
            _d.setLiquidationInProgress();
        }
    }

    /// @notice     Closes an auction and purchases the signer bonds. Payout to buyer, funder, then signers if not fraud.
    /// @dev        For interface, reading auctionValue will give a past value. the current is better.
    /// @param  _d  Deposit storage pointer.
    function purchaseSignerBondsAtAuction(
        DepositUtilsMock.DepositMock storage _d
    ) external {
        require(_d.inSignerLiquidation(), "No active auction");

        _d.setLiquidated();
        _d.logLiquidated();
    }

    /// @notice     Notify the contract that the signers are undercollateralized.
    /// @dev        Calls out to the system for oracle info.
    /// @param  _d  Deposit storage pointer.
    function notifyCourtesyCall(DepositUtilsMock.DepositMock storage _d)
        external
    {
        require(_d.inActive(), "Can only courtesy call from active state");

        _d.courtesyCallInitiated = block.timestamp;
        _d.setCourtesyCall();
        _d.logCourtesyCalled();
    }

    /// @notice     Goes from courtesy call to active.
    /// @dev        Only callable if collateral is sufficient and the deposit is not expiring.
    /// @param  _d  Deposit storage pointer.
    function exitCourtesyCall(DepositUtilsMock.DepositMock storage _d)
        external
    {
        require(_d.inCourtesyCall(), "Not currently in courtesy call");
        _d.setActive();
        _d.logExitedCourtesyCall();
    }

    /// @notice     Notify the contract that the signers are undercollateralized.
    /// @dev        Calls out to the system for oracle info.
    /// @param  _d  Deposit storage pointer.
    function notifyUndercollateralizedLiquidation(
        DepositUtilsMock.DepositMock storage _d
    ) external {
        require(
            _d.inRedeemableState(),
            "Deposit not in active or courtesy call"
        );
        startLiquidation(_d, false);
    }

    /// @notice     Notifies the contract that the courtesy period has elapsed.
    /// @dev        This is treated as an abort, rather than fraud.
    /// @param  _d  Deposit storage pointer.
    function notifyCourtesyCallExpired(DepositUtilsMock.DepositMock storage _d)
        external
    {
        require(_d.inCourtesyCall(), "Not in a courtesy call period");
        startLiquidation(_d, false);
    }
}
