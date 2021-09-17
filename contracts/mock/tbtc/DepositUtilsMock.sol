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
}
