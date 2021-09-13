// SPDX-License-Identifier: MIT

pragma solidity ^0.5.0;

import {DepositUtilsMock} from "./DepositUtilsMock.sol";

library DepositStatesMock {
    enum States {
        // DOES NOT EXIST YET
        START,
        // FUNDING FLOW
        AWAITING_SIGNER_SETUP,
        AWAITING_BTC_FUNDING_PROOF,
        // FAILED SETUP
        FAILED_SETUP,
        // ACTIVE
        ACTIVE, // includes courtesy call
        // REDEMPTION FLOW
        AWAITING_WITHDRAWAL_SIGNATURE,
        AWAITING_WITHDRAWAL_PROOF,
        REDEEMED,
        // SIGNER LIQUIDATION FLOW
        COURTESY_CALL,
        FRAUD_LIQUIDATION_IN_PROGRESS,
        LIQUIDATION_IN_PROGRESS,
        LIQUIDATED
    }

    /// @notice     Check if the contract is currently in the funding flow.
    /// @dev        This checks on the funding flow happy path, not the fraud path.
    /// @param _d   Deposit storage pointer.
    /// @return     True if contract is currently in the funding flow else False.
    function inFunding(DepositUtilsMock.DepositMock storage _d)
        external
        view
        returns (bool)
    {
        return (_d.currentState == uint8(States.AWAITING_SIGNER_SETUP) ||
            _d.currentState == uint8(States.AWAITING_BTC_FUNDING_PROOF));
    }

    /// @notice     Check if the contract is currently in the signer liquidation flow.
    /// @dev        This could be caused by fraud, or by an unfilled margin call.
    /// @param _d   Deposit storage pointer.
    /// @return     True if contract is currently in the liquidaton flow else False.
    function inSignerLiquidation(DepositUtilsMock.DepositMock storage _d)
        external
        view
        returns (bool)
    {
        return (_d.currentState == uint8(States.LIQUIDATION_IN_PROGRESS) ||
            _d.currentState == uint8(States.FRAUD_LIQUIDATION_IN_PROGRESS));
    }

    /// @notice     Check if the contract is currently in the redepmtion flow.
    /// @dev        This checks on the redemption flow, not the REDEEMED termination state.
    /// @param _d   Deposit storage pointer.
    /// @return     True if contract is currently in the redemption flow else False.
    function inRedemption(DepositUtilsMock.DepositMock storage _d)
        external
        view
        returns (bool)
    {
        return (_d.currentState ==
            uint8(States.AWAITING_WITHDRAWAL_SIGNATURE) ||
            _d.currentState == uint8(States.AWAITING_WITHDRAWAL_PROOF));
    }

    /// @notice     Check if the contract has halted.
    /// @dev        This checks on any halt state, regardless of triggering circumstances.
    /// @param _d   Deposit storage pointer.
    /// @return     True if contract has halted permanently.
    function inEndState(DepositUtilsMock.DepositMock storage _d)
        external
        view
        returns (bool)
    {
        return (_d.currentState == uint8(States.LIQUIDATED) ||
            _d.currentState == uint8(States.REDEEMED) ||
            _d.currentState == uint8(States.FAILED_SETUP));
    }

    /// @notice     Check if the contract is available for a redemption request.
    /// @dev        Redemption is available from active and courtesy call.
    /// @param _d   Deposit storage pointer.
    /// @return     True if available, False otherwise.
    function inRedeemableState(DepositUtilsMock.DepositMock storage _d)
        external
        view
        returns (bool)
    {
        return (_d.currentState == uint8(States.ACTIVE) ||
            _d.currentState == uint8(States.COURTESY_CALL));
    }

    /// @notice     Check if the contract is currently in the start state (awaiting setup).
    /// @dev        This checks on the funding flow happy path, not the fraud path.
    /// @param _d   Deposit storage pointer.
    /// @return     True if contract is currently in the start state else False.
    function inStart(DepositUtilsMock.DepositMock storage _d)
        external
        view
        returns (bool)
    {
        return (_d.currentState == uint8(States.START));
    }

    function inAwaitingSignerSetup(DepositUtilsMock.DepositMock storage _d)
        external
        view
        returns (bool)
    {
        return _d.currentState == uint8(States.AWAITING_SIGNER_SETUP);
    }

    function inAwaitingBTCFundingProof(DepositUtilsMock.DepositMock storage _d)
        external
        view
        returns (bool)
    {
        return _d.currentState == uint8(States.AWAITING_BTC_FUNDING_PROOF);
    }

    function inFailedSetup(DepositUtilsMock.DepositMock storage _d)
        external
        view
        returns (bool)
    {
        return _d.currentState == uint8(States.FAILED_SETUP);
    }

    function inActive(DepositUtilsMock.DepositMock storage _d)
        external
        view
        returns (bool)
    {
        return _d.currentState == uint8(States.ACTIVE);
    }

    function inAwaitingWithdrawalSignature(DepositUtilsMock.DepositMock storage _d)
        external
        view
        returns (bool)
    {
        return _d.currentState == uint8(States.AWAITING_WITHDRAWAL_SIGNATURE);
    }

    function inAwaitingWithdrawalProof(DepositUtilsMock.DepositMock storage _d)
        external
        view
        returns (bool)
    {
        return _d.currentState == uint8(States.AWAITING_WITHDRAWAL_PROOF);
    }

    function inRedeemed(DepositUtilsMock.DepositMock storage _d)
        external
        view
        returns (bool)
    {
        return _d.currentState == uint8(States.REDEEMED);
    }

    function inCourtesyCall(DepositUtilsMock.DepositMock storage _d)
        external
        view
        returns (bool)
    {
        return _d.currentState == uint8(States.COURTESY_CALL);
    }

    function inFraudLiquidationInProgress(DepositUtilsMock.DepositMock storage _d)
        external
        view
        returns (bool)
    {
        return _d.currentState == uint8(States.FRAUD_LIQUIDATION_IN_PROGRESS);
    }

    function inLiquidationInProgress(DepositUtilsMock.DepositMock storage _d)
        external
        view
        returns (bool)
    {
        return _d.currentState == uint8(States.LIQUIDATION_IN_PROGRESS);
    }

    function inLiquidated(DepositUtilsMock.DepositMock storage _d)
        external
        view
        returns (bool)
    {
        return _d.currentState == uint8(States.LIQUIDATED);
    }

    function setAwaitingSignerSetup(DepositUtilsMock.DepositMock storage _d) external {
        _d.currentState = uint8(States.AWAITING_SIGNER_SETUP);
    }

    function setAwaitingBTCFundingProof(DepositUtilsMock.DepositMock storage _d)
        external
    {
        _d.currentState = uint8(States.AWAITING_BTC_FUNDING_PROOF);
    }

    function setFailedSetup(DepositUtilsMock.DepositMock storage _d) external {
        _d.currentState = uint8(States.FAILED_SETUP);
    }

    function setActive(DepositUtilsMock.DepositMock storage _d) external {
        _d.currentState = uint8(States.ACTIVE);
    }

    function setAwaitingWithdrawalSignature(DepositUtilsMock.DepositMock storage _d)
        external
    {
        _d.currentState = uint8(States.AWAITING_WITHDRAWAL_SIGNATURE);
    }

    function setAwaitingWithdrawalProof(DepositUtilsMock.DepositMock storage _d)
        external
    {
        _d.currentState = uint8(States.AWAITING_WITHDRAWAL_PROOF);
    }

    function setRedeemed(DepositUtilsMock.DepositMock storage _d) external {
        _d.currentState = uint8(States.REDEEMED);
    }

    function setCourtesyCall(DepositUtilsMock.DepositMock storage _d) external {
        _d.currentState = uint8(States.COURTESY_CALL);
    }

    function setFraudLiquidationInProgress(DepositUtilsMock.DepositMock storage _d)
        external
    {
        _d.currentState = uint8(States.FRAUD_LIQUIDATION_IN_PROGRESS);
    }

    function setLiquidationInProgress(DepositUtilsMock.DepositMock storage _d)
        external
    {
        _d.currentState = uint8(States.LIQUIDATION_IN_PROGRESS);
    }

    function setLiquidated(DepositUtilsMock.DepositMock storage _d) external {
        _d.currentState = uint8(States.LIQUIDATED);
    }
}
