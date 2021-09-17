// SPDX-License-Identifier: MIT

pragma solidity 0.8.4;

import {DepositUtilsMock} from "./DepositUtilsMock.sol";
import {DepositStatesMock} from "./DepositStatesMock.sol";
import {OutsourceDepositLoggingMock} from "./OutsourceDepositLoggingMock.sol";

library DepositFundingMock {
    using DepositUtilsMock for DepositUtilsMock.DepositMock;
    using DepositStatesMock for DepositUtilsMock.DepositMock;
    using OutsourceDepositLoggingMock for DepositUtilsMock.DepositMock;

    /// @notice Internally called function to set up a newly created Deposit
    ///         instance. This should not be called by developers, use
    ///         `DepositFactory.createDeposit` to create a new deposit.
    /// @dev If called directly, the transaction will revert since the call will
    ///      be executed on an already set-up instance.
    /// @param _d Deposit storage pointer.
    /// @param _lotSizeSatoshis Lot size in satoshis.
    function initialize(
        DepositUtilsMock.DepositMock storage _d,
        uint64 _lotSizeSatoshis
    ) public {
        require(_d.inStart(), "Deposit setup already requested");

        _d.lotSizeSatoshis = _lotSizeSatoshis;

        _d.setAwaitingSignerSetup();
        _d.logCreated();
    }
}
