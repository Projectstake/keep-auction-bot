// SPDX-License-Identifier: MIT

pragma solidity ^0.5.0;

import {DepositFundingMock} from "./DepositFundingMock.sol";
import {DepositLiquidationMock} from "./DepositLiquidationMock.sol";
import {DepositUtilsMock} from "./DepositUtilsMock.sol";
import {DepositStatesMock} from "./DepositStatesMock.sol";
import {TBTCSystemMock} from "./TBTCSystemMock.sol";
import {TBTCDepositTokenMock} from "./TBTCDepositTokenMock.sol";

import "./DepositFactoryAuthorityMock.sol";

// solium-disable function-order
// Below, a few functions must be public to allow bytes memory parameters, but
// their being so triggers errors because public functions should be grouped
// below external functions. Since these would be external if it were possible,
// we ignore the issue.

/// @title  tBTC Deposit
/// @notice This is the main contract for tBTC. It is the state machine that
///         (through various libraries) handles bitcoin funding, bitcoin-spv
///         proofs, liquidation, and fraud logic.
/// @dev This contract presents a public API that exposes the following
///      libraries:
///
///       - `DepositLiquidaton`
///       - `DepositStatesMock`
///       - `DepositUtilsMock`
///       - `OutsourceDepositLogging`
///
///      Where these libraries require deposit state, this contract's state
///      variable `self` is used. `self` is a struct of type
///      `DepositUtilsMock.DepositMock` that contains all aspects of the deposit state
///      itself.
contract DepositMock is DepositFactoryAuthorityMock {
    using DepositFundingMock for DepositUtilsMock.DepositMock;
    using DepositLiquidationMock for DepositUtilsMock.DepositMock;
    using DepositUtilsMock for DepositUtilsMock.DepositMock;
    using DepositStatesMock for DepositUtilsMock.DepositMock;

    DepositUtilsMock.DepositMock self;

    /// @dev Deposit should only be _constructed_ once. New deposits are created
    ///      using the `DepositFactory.createDeposit` method, and are clones of
    ///      the constructed deposit. The factory will set the initial values
    ///      for a new clone using `initializeDeposit`.
    constructor() public {
        // The constructed Deposit will never be used, so the deposit factory
        // address can be anything. Clones are updated as per above.
        initialize(address(0xdeadbeef));
    }

    /// @notice Deposits do not accept arbitrary ETH.
    function() external payable {
        require(
            msg.data.length == 0,
            "Deposit contract was called with unknown function selector."
        );
    }

    //----------------------------- METADATA LOOKUP ------------------------------//

    /// @notice Get this deposit's BTC lot size in satoshis.
    /// @return uint64 lot size in satoshis.
    function lotSizeSatoshis() external view returns (uint64) {
        return self.lotSizeSatoshis;
    }

    /// @notice Get the integer representing the current state.
    /// @dev We implement this because contracts don't handle foreign enums
    ///      well. See `DepositStatesMock` for more info on states.
    /// @return The 0-indexed state from the DepositStatesMock enum.
    function currentState() external view returns (uint256) {
        return uint256(self.currentState);
    }

    /// @notice Check if the Deposit is in ACTIVE state.
    /// @return True if state is ACTIVE, false otherwise.
    function inActive() external view returns (bool) {
        return self.inActive();
    }

    //---------------------------- LIQUIDATION FLOW ------------------------------//

    /// @notice Notify the contract that the signers are undercollateralized.
    /// @dev This call will revert if the signers are not in fact
    ///      undercollateralized according to the price feed. After
    ///      TBTCConstants.COURTESY_CALL_DURATION, courtesy call times out and
    ///      regular abort liquidation occurs; see
    ///      `notifyCourtesyTimedOut`.
    function notifyCourtesyCall() external {
        self.notifyCourtesyCall();
    }

    /// @notice Notify the contract that the signers' bond value has recovered
    ///         enough to be considered sufficiently collateralized.
    /// @dev This call will revert if collateral is still below the
    ///      undercollateralized threshold according to the price feed.
    function exitCourtesyCall() external {
        self.exitCourtesyCall();
    }

    /// @notice Notify the contract that the courtesy period has expired and the
    ///         deposit should move into liquidation.
    /// @dev This call will revert if the courtesy call period has not in fact
    ///      expired or is not in the courtesy call state. Courtesy call
    ///      expiration is treated as an abort, and is handled by seizing signer
    ///      bonds and putting them up for auction for the lot size amount in
    ///      TBTC (see `purchaseSignerBondsAtAuction`). Emits a
    ///      LiquidationStarted event. The caller is captured as the liquidation
    ///      initiator, and is eligible for 50% of any bond left after the
    ///      auction is completed.
    function notifyCourtesyCallExpired() external {
        self.notifyCourtesyCallExpired();
    }

    /// @notice Notify the contract that the signers are undercollateralized.
    /// @dev Calls out to the system for oracle info.
    /// @dev This call will revert if the signers are not in fact severely
    ///      undercollateralized according to the price feed. Severe
    ///      undercollateralization is treated as an abort, and is handled by
    ///      seizing signer bonds and putting them up for auction in exchange
    ///      for the lot size amount in TBTC (see
    ///      `purchaseSignerBondsAtAuction`). Emits a LiquidationStarted event.
    ///      The caller is captured as the liquidation initiator, and is
    ///      eligible for 50% of any bond left after the auction is completed.
    function notifyUndercollateralizedLiquidation() external {
        self.notifyUndercollateralizedLiquidation();
    }

    //--------------------------- MUTATING HELPERS -------------------------------//

    /// @notice This function can only be called by the deposit factory; use
    ///         `DepositFactory.createDeposit` to create a new deposit.
    /// @dev Initializes a new deposit clone with the base state for the
    ///      deposit.
    /// @param _tbtcSystem `TBTCSystem` contract. More info in `TBTCSystem`.
    /// @param _tbtcDepositToken `TBTCDepositToken` (TDT) contract. More info in
    ///        `TBTCDepositToken`.
    /// @param _lotSizeSatoshis The minimum amount of satoshi the funder is
    ///                         required to send. This is also the amount of
    ///                         TBTC the TDT holder will be eligible to mint:
    ///                         (10**7 satoshi == 0.1 BTC == 0.1 TBTC).
    function initializeDeposit(
        TBTCSystemMock _tbtcSystem,
        TBTCDepositTokenMock _tbtcDepositToken,
        uint64 _lotSizeSatoshis
    ) public payable onlyFactory {
        self.tbtcSystem = _tbtcSystem;
        self.tbtcDepositToken = _tbtcDepositToken;
        self.initialize(_lotSizeSatoshis);
    }
}
