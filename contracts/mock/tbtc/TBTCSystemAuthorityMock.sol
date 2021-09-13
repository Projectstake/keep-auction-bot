// SPDX-License-Identifier: MIT

pragma solidity ^0.5.0;

/// @title  TBTC System Authority.
/// @notice Contract to secure function calls to the TBTC System contract.
/// @dev    The `TBTCSystem` contract address is passed as a constructor parameter.
contract TBTCSystemAuthorityMock {
    address internal tbtcSystemAddress;

    /// @notice Set the address of the System contract on contract initialization.
    constructor(address _tbtcSystemAddress) public {
        tbtcSystemAddress = _tbtcSystemAddress;
    }

    /// @notice Function modifier ensures modified function is only called by TBTCSystem.
    modifier onlyTbtcSystem() {
        require(
            msg.sender == tbtcSystemAddress,
            "Caller must be tbtcSystem contract"
        );
        _;
    }
}
