// SPDX-License-Identifier: MIT

pragma solidity 0.8.4;

import {TBTCSystemMock} from "./TBTCSystemMock.sol";
import {TBTCDepositTokenMock} from "./TBTCDepositTokenMock.sol";
import {DepositStatesMock} from "./DepositStatesMock.sol";

library DepositUtilsMock {
    using DepositStatesMock for DepositUtilsMock.DepositMock;

    struct DepositMock {
        TBTCSystemMock tbtcSystem;
        TBTCDepositTokenMock tbtcDepositToken;
        uint64 lotSizeSatoshis;
        uint8 currentState;
        // SET ON FRAUD
        uint256 courtesyCallInitiated; // When the courtesy call is issued
        // written when we get funded
        uint256 fundedAt; // timestamp when funding proof was received
    }

    uint256 public constant SATOSHI_MULTIPLIER = 10**10; // multiplier to convert satoshi to TBTC token units

    /// @notice         Gets the lot size in erc20 decimal places (max 18)
    /// @return         uint256 lot size in 10**18 decimals.
    function lotSizeTbtc(DepositMock storage _d) public view returns (uint256) {
        return _d.lotSizeSatoshis * SATOSHI_MULTIPLIER;
    }
}
