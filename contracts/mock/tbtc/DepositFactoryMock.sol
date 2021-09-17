// SPDX-License-Identifier: MIT

pragma solidity 0.8.4;

import "./DepositMock.sol";
import "./TBTCSystemMock.sol";
import "./TBTCSystemAuthorityMock.sol";

import {TBTCDepositTokenMock} from "./TBTCDepositTokenMock.sol";

/// @title Deposit Factory
/// @notice Factory for the creation of new deposit clones.
/// @dev We avoid redeployment of deposit contract by using the clone factory.
/// Proxy delegates calls to Deposit and therefore does not affect deposit state.
/// This means that we only need to deploy the deposit contracts once.
/// The factory provides clean state for every new deposit clone.
contract DepositFactoryMock is
    TBTCSystemAuthorityMock // is CloneFactory, TBTCSystemAuthority {
{
    // Holds the address of the deposit contract
    // which will be used as a master contract for cloning.
    address payable public masterDepositAddress;
    TBTCDepositTokenMock tbtcDepositToken;
    TBTCSystemMock public tbtcSystem;

    constructor(address _systemAddress)
        TBTCSystemAuthorityMock(_systemAddress)
    {}

    /// @dev                          Set the required external variables.
    /// @param _masterDepositAddress  The address of the master deposit contract.
    /// @param _tbtcSystem            Tbtc system contract.
    /// @param _tbtcDepositToken      TBTC Deposit Token contract.
    function setExternalDependencies(
        address payable _masterDepositAddress,
        TBTCSystemMock _tbtcSystem,
        TBTCDepositTokenMock _tbtcDepositToken
    ) external onlyTbtcSystem {
        masterDepositAddress = _masterDepositAddress;
        tbtcDepositToken = _tbtcDepositToken;
        tbtcSystem = _tbtcSystem;
    }

    function createClone(address target) internal returns (address result) {
        bytes20 targetBytes = bytes20(target);
        assembly {
            let clone := mload(0x40)
            mstore(
                clone,
                0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000
            )
            mstore(add(clone, 0x14), targetBytes)
            mstore(
                add(clone, 0x28),
                0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000
            )
            result := create(0, clone, 0x37)
        }
    }

    event DepositCloneCreated(address depositCloneAddress);

    /// @notice Creates a new deposit instance and mints a TDT. This function is
    ///         currently the only way to create a new deposit.
    /// @dev Calls `DepositMock.initializeDeposit` to initialize the instance. Mints
    ///      the TDT to the function caller. (See `TBTCDepositTokenMock` for more
    ///      info on TDTs).
    /// @return The address of the new deposit.
    function createDeposit(uint64 _lotSizeSatoshis)
        external
        payable
        returns (address)
    {
        address cloneAddress = createClone(masterDepositAddress);
        emit DepositCloneCreated(cloneAddress);

        TBTCDepositTokenMock(tbtcDepositToken).mint(
            msg.sender,
            uint256(uint160(cloneAddress))
        );

        DepositMock deposit = DepositMock(address(uint160(cloneAddress)));
        deposit.initialize(address(this));
        deposit.initializeDeposit{value: msg.value}(
            tbtcSystem,
            tbtcDepositToken,
            _lotSizeSatoshis
        );

        return cloneAddress;
    }
}
