// SPDX-License-Identifier: MIT

/* solium-disable function-order */

pragma solidity ^0.5.0;

import {DepositFactoryMock} from "./DepositFactoryMock.sol";

import {DepositLogMock} from "./DepositLogMock.sol";

import {TBTCDepositTokenMock} from "./TBTCDepositTokenMock.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/// @title TBTC System.
/// @notice This contract acts as a central point for access control,
///         value governance, and price feed.
/// @dev    Governable values should only affect new deposit creation.
contract TBTCSystemMock is Ownable, DepositLogMock {
    using SafeMath for uint256;

    uint256 initializedTimestamp = 0;

    /// @notice        Initialize contracts
    /// @dev           Only the Deposit factory should call this, and only once.
    /// @param _depositFactory    Deposit Factory. More info in `DepositFactoryMock`.
    /// @param _masterDepositAddress  Master Deposit address. More info in `Deposit`.
    /// @param _tbtcDepositToken  TBTCDepositTokenMock (TDT). More info in `TBTCDepositTokenMock`.
    function initialize(
        DepositFactoryMock _depositFactory,
        address payable _masterDepositAddress,
        TBTCDepositTokenMock _tbtcDepositToken
    ) external onlyOwner {
        require(initializedTimestamp == 0, "already initialized");

        initializedTimestamp = block.timestamp;

        setTbtcDepositToken(_tbtcDepositToken);

        _depositFactory.setExternalDependencies(
            _masterDepositAddress,
            this,
            _tbtcDepositToken
        );
    }
}
