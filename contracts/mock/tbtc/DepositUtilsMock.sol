// SPDX-License-Identifier: MIT

pragma solidity ^0.5.0;

import {SafeMath} from "openzeppelin-solidity/contracts/math/SafeMath.sol";
import {TBTCSystemMock} from "./TBTCSystemMock.sol";
import {TBTCDepositTokenMock} from "./TBTCDepositTokenMock.sol";
import {DepositStatesMock} from "./DepositStatesMock.sol";

library DepositUtilsMock {
    using SafeMath for uint256;
    using SafeMath for uint64;
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
