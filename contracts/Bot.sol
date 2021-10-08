// SPDX-License-Identifier: MIT

pragma solidity 0.8.4;

import "./interfaces/IAuction.sol";
import "./interfaces/IAuctionBidder.sol";
import "./interfaces/IDeposit.sol";
import "./interfaces/IRiskManagerV1.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title Bot
/// @notice The auction bot contract that bids on deposit auctions.
contract Bot is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable currencyToken;
    IERC20 public immutable collateralToken;
    IRiskManagerV1 public immutable riskManager;
    IAuctionBidder public immutable auctionBidder;
    address public immutable auctioneerAddress;

    // The Bot contract's beneficiary account. Withdrawn funds will be sent to
    // this account. The beneficiary account is set on contract deployment. A
    // new beneficiary account can be set with a call to setBeneficiary().
    address payable public beneficiaryAddress;

    // See https://github.com/keep-network/tbtc/blob/v1.1.0/solidity/contracts/deposit/DepositStates.sol
    enum DepositState {
        START,
        AWAITING_SIGNER_SETUP,
        AWAITING_BTC_FUNDING_PROOF,
        FAILED_SETUP,
        ACTIVE,
        AWAITING_WITHDRAWAL_SIGNATURE,
        AWAITING_WITHDRAWAL_PROOF,
        REDEEMED,
        COURTESY_CALL,
        FRAUD_LIQUIDATION_IN_PROGRESS,
        LIQUIDATION_IN_PROGRESS,
        LIQUIDATED
    }

    event ReceivedEther(
        address indexed sender,
        uint256 amount,
        uint256 timestamp
    );
    event WithdrewEther(
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );
    event WithdrewCurrencyTokens(
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );
    event WithdrewCollateralTokens(
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );
    event NotifiedStartedLiquidation(
        address indexed deposit,
        uint256 timestamp
    );
    event NotifiedLiquidated(address indexed deposit, uint256 timestamp);

    modifier depositInLiquidation(address depositAddress) {
        IDeposit deposit = IDeposit(depositAddress);
        require(inLiquidation(deposit), "Deposit not in liquidation");
        _;
    }

    modifier depositIsLiquidated(address depositAddress) {
        IDeposit deposit = IDeposit(depositAddress);
        require(isLiquidated(deposit), "Deposit not liquidated");
        _;
    }

    function inLiquidation(IDeposit deposit) internal view returns (bool) {
        uint256 state = deposit.currentState();
        return (state == uint256(DepositState.FRAUD_LIQUIDATION_IN_PROGRESS) ||
            state == uint256(DepositState.LIQUIDATION_IN_PROGRESS));
    }

    function isLiquidated(IDeposit deposit) internal view returns (bool) {
        uint256 state = deposit.currentState();
        return state == uint256(DepositState.LIQUIDATED);
    }

    constructor(
        IERC20 _currencyToken,
        IERC20 _collateralToken,
        IRiskManagerV1 _riskManager,
        IAuctionBidder _auctionBidder,
        address _auctioneerAddress,
        address payable _beneficiaryAddress
    ) {
        currencyToken = _currencyToken;
        collateralToken = _collateralToken;
        riskManager = _riskManager;
        auctionBidder = _auctionBidder;
        auctioneerAddress = _auctioneerAddress;
        beneficiaryAddress = _beneficiaryAddress;
    }

    function setBeneficiary(address payable _beneficiaryAddress)
        external
        onlyOwner
    {
        beneficiaryAddress = _beneficiaryAddress;
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /// @notice Transfers the contract's entire balance of Ether to the
    ///         beneficiary account.
    /// @dev Can be called only by the contract owner.
    ///      Does not attempt to prevent a reentrancy attack since recipient
    ///      is presumably a trusted account.
    function withdrawEther() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "Account balance is zero");
        (bool success, ) = beneficiaryAddress.call{value: balance}("");
        require(success, "Ether withdrawal failed");
        emit WithdrewEther(beneficiaryAddress, balance, block.timestamp);
    }

    /// @notice Transfers the contract's entire balance of currency tokens to
    ///         the beneficiary account.
    /// @dev Can be called only by the contract owner.
    function withdrawCurrencyToken() external onlyOwner {
        uint256 balance = IERC20(currencyToken).balanceOf(address(this));
        require(balance > 0, "Account balance is zero");
        IERC20(currencyToken).safeTransfer(beneficiaryAddress, balance);
        emit WithdrewCurrencyTokens(
            beneficiaryAddress,
            balance,
            block.timestamp
        );
    }

    /// @notice Transfers the contract's entire balance of collateral tokens to
    ///         the beneficiary account.
    /// @dev Can be called only by the contract owner.
    function withdrawCollateralToken() external onlyOwner {
        uint256 balance = IERC20(collateralToken).balanceOf(address(this));
        require(balance > 0, "Account balance is zero");
        IERC20(collateralToken).safeTransfer(beneficiaryAddress, balance);
        emit WithdrewCollateralTokens(
            beneficiaryAddress,
            balance,
            block.timestamp
        );
    }

    /// @notice Notifies the RiskManagerV1 contract of a tBTC deposit's pending
    ///         liquidation. In return, the coverage pool will grant the
    ///         notifying bot a portion of its asset pool (underwriter tokens),
    ///         if the bot happens to be the first notifier of the liquidation
    ///         status.
    /// @dev Can be called only by the contract owner.
    /// @param depositAddress Address of the liquidated deposit
    function handleDepositStartedLiquidation(address depositAddress)
        external
        onlyOwner
        depositInLiquidation(depositAddress)
    {
        riskManager.notifyLiquidation(depositAddress);
        emit NotifiedStartedLiquidation(depositAddress, block.timestamp);
    }

    /// @notice Notifies the RiskManagerV1 contract of a tBTC deposit's
    ///         liquidation. In return, the coverage pool will grant the
    ///         notifying bot a portion of its asset pool (underwriter tokens),
    ///         if the bot happens to be the first notifier of the liquidation
    ///         status.
    /// @dev Can be called only by the contract owner.
    /// @param depositAddress Address of the liquidated deposit
    function handleDepositLiquidated(address depositAddress)
        external
        onlyOwner
        depositIsLiquidated(depositAddress)
    {
        riskManager.notifyLiquidated(depositAddress);
        emit NotifiedLiquidated(depositAddress, block.timestamp);
    }

    receive() external payable {
        emit ReceivedEther(msg.sender, msg.value, block.timestamp);
    }
}
