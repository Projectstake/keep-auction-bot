// ▓▓▌ ▓▓ ▐▓▓ ▓▓▓▓▓▓▓▓▓▓▌▐▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▄
// ▓▓▓▓▓▓▓▓▓▓ ▓▓▓▓▓▓▓▓▓▓▌▐▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
//   ▓▓▓▓▓▓    ▓▓▓▓▓▓▓▀    ▐▓▓▓▓▓▓    ▐▓▓▓▓▓   ▓▓▓▓▓▓     ▓▓▓▓▓   ▐▓▓▓▓▓▌   ▐▓▓▓▓▓▓
//   ▓▓▓▓▓▓▄▄▓▓▓▓▓▓▓▀      ▐▓▓▓▓▓▓▄▄▄▄         ▓▓▓▓▓▓▄▄▄▄         ▐▓▓▓▓▓▌   ▐▓▓▓▓▓▓
//   ▓▓▓▓▓▓▓▓▓▓▓▓▓▀        ▐▓▓▓▓▓▓▓▓▓▓         ▓▓▓▓▓▓▓▓▓▓         ▐▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
//   ▓▓▓▓▓▓▀▀▓▓▓▓▓▓▄       ▐▓▓▓▓▓▓▀▀▀▀         ▓▓▓▓▓▓▀▀▀▀         ▐▓▓▓▓▓▓▓▓▓▓▓▓▓▓▀
//   ▓▓▓▓▓▓   ▀▓▓▓▓▓▓▄     ▐▓▓▓▓▓▓     ▓▓▓▓▓   ▓▓▓▓▓▓     ▓▓▓▓▓   ▐▓▓▓▓▓▌
// ▓▓▓▓▓▓▓▓▓▓ █▓▓▓▓▓▓▓▓▓ ▐▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ▓▓▓▓▓▓▓▓▓▓
// ▓▓▓▓▓▓▓▓▓▓ ▓▓▓▓▓▓▓▓▓▓ ▐▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ▓▓▓▓▓▓▓▓▓▓
//
//                           Trust math, not hardware.

// SPDX-License-Identifier: MIT

pragma solidity 0.8.4;

import "../../interfaces/IRiskManagerV1.sol";
import "../tbtc/DepositMock.sol";
import "./AuctioneerMock.sol";
import "./AuctionMock.sol";
import "./CoveragePoolConstants.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title tBTC v1 deposit token (TDT) interface
/// @notice This is an interface with just a few function signatures of a main
///      contract from tBTC. For more information about tBTC Deposit please see:
///      https://github.com/keep-network/tbtc/blob/solidity/v1.1.0/solidity/contracts/system/TBTCDepositToken.sol
interface ITBTCDepositToken {
    function exists(uint256 _tokenId) external view returns (bool);
}

/// @title Risk Manager for tBTC v1
/// @notice Risk Manager is a smart contract with the exclusive right to claim
///         coverage from the coverage pool. Demanding coverage is akin to
///         filing a claim in traditional insurance and processing your own
///         claim. The risk manager holds an incredibly privileged position,
///         because the ability to claim coverage of an arbitrarily large
///         position could bankrupt the coverage pool.
///         tBTC v1 risk manager demands coverage by opening an auction for TBTC
///         and liquidating portion of the coverage pool when tBTC v1 deposit is
///         in liquidation and signer bonds on offer reached the specific
///         threshold. In practice, it means no one is willing to purchase
///         signer bonds for that deposit on tBTC side.
contract RiskManagerV1Mock is IRiskManagerV1, AuctioneerMock, Ownable {
    using SafeERC20 for IERC20;

    /// @notice Governance delay that needs to pass before any risk manager
    ///         parameter change initiated by the governance takes effect.
    uint256 public constant GOVERNANCE_DELAY = 12 hours;

    // See https://github.com/keep-network/tbtc/blob/v1.1.0/solidity/contracts/deposit/DepositStates.sol
    uint256 public constant DEPOSIT_FRAUD_LIQUIDATION_IN_PROGRESS_STATE = 9;
    uint256 public constant DEPOSIT_LIQUIDATION_IN_PROGRESS_STATE = 10;
    uint256 public constant DEPOSIT_LIQUIDATED_STATE = 11;

    /// @notice The length with which every new auction is opened. Auction length
    ///         is the amount of time it takes for the auction to get to 100%
    ///         of all collateral on offer, in seconds. This parameter value
    ///         should be updated and kept up to date based on the coverage pool
    ///         TVL and tBTC v1 minimum lot size allowed so that a new auction
    ///         does not liquidate too much too early. Auction length is the
    ///         same, no matter tBTC deposit lot size.
    ///         The value can be updated by the governance in two steps.
    ///         First step is to begin the update process with the new value
    ///         and the second step is to finalize it after
    ///         `GOVERNANCE_DELAY` has passed.
    uint256 public auctionLength;
    uint256 public newAuctionLength;
    uint256 public auctionLengthChangeInitiated;

    IERC20 public immutable tbtcToken;
    ITBTCDepositToken public immutable tbtcDepositToken;

    // deposit in liquidation => opened coverage pool auction
    mapping(address => address) public depositToAuction;
    // opened coverage pool auction => deposit in liquidation
    mapping(address => address) public auctionToDeposit;

    event NotifiedLiquidated(address indexed deposit, address notifier);
    event NotifiedLiquidation(address indexed deposit, address notifier);

    constructor(
        IERC20 _tbtcToken,
        ITBTCDepositToken _tbtcDepositToken,
        CoveragePoolMock _coveragePool,
        address _masterAuction,
        uint256 _auctionLength
    ) AuctioneerMock(_coveragePool, _masterAuction) {
        tbtcToken = _tbtcToken;
        tbtcDepositToken = _tbtcDepositToken;
        auctionLength = _auctionLength;
    }

    /// @notice Receives ETH from tBTC for purchasing and withdrawing deposit
    ///         signer bonds.
    //slither-disable-next-line locked-ether
    receive() external payable {}

    /// @notice Notifies the risk manager about tBTC deposit in liquidation
    ///         state for which signer bonds on offer passed the threshold
    ///         expected by the risk manager. In practice, it means no one else
    ///         is willing to purchase signer bonds from that deposit so the
    ///         risk manager should open an auction to collect TBTC and purchase
    ///         those bonds liquidating part of the coverage pool. If there is
    ///         enough TBTC surplus from earlier auctions accumulated by the
    ///         risk manager, bonds are purchased right away without opening an
    ///         auction. Notifier calling this function receives a share in the
    ///         coverage pool as a reward - underwriter tokens are transferred
    ///         to the notifier's address.
    /// @param  depositAddress liquidating tBTC deposit address
    function notifyLiquidation(address depositAddress) external override {
        // require(
        //     tbtcDepositToken.exists(uint256(uint160(depositAddress))),
        //     "Address is not a deposit contract"
        // );

        DepositMock deposit = DepositMock(depositAddress);
        require(
            isDepositLiquidationInProgress(deposit),
            "Deposit is not in liquidation state"
        );

        require(
            depositToAuction[depositAddress] == address(0),
            "Already notified on the deposit in liquidation"
        );

        uint256 lotSizeTbtc = deposit.lotSizeTbtc();

        emit NotifiedLiquidation(depositAddress, msg.sender);

        // slither-disable-next-line reentrancy-no-eth
        address auctionAddress = createAuction(
            tbtcToken,
            lotSizeTbtc,
            auctionLength
        );
        depositToAuction[depositAddress] = auctionAddress;
        auctionToDeposit[auctionAddress] = depositAddress;
    }

    /// @notice Notifies the risk manager about tBTC deposit liquidated outside
    ///         the coverage pool for which the risk manager opened an auction
    ///         earlier (as a result of `notifyLiquidation` call). Function
    ///         closes the auction early and collects TBTC surplus from the
    ///         auction in case the auction was partially taken before the
    ///         deposit got liquidated. Notifier calling this function receives
    ///         a share in the coverage pool as a reward - underwriter tokens
    ///         are transferred to the notifier's address.
    /// @param  depositAddress liquidated tBTC Deposit address
    function notifyLiquidated(address depositAddress) external override {
        require(
            depositToAuction[depositAddress] != address(0),
            "No auction for given deposit"
        );

        DepositMock deposit = DepositMock(depositAddress);
        require(
            deposit.currentState() == DEPOSIT_LIQUIDATED_STATE,
            "Deposit is not in liquidated state"
        );
        emit NotifiedLiquidated(depositAddress, msg.sender);

        AuctionMock auction = AuctionMock(depositToAuction[depositAddress]);

        delete depositToAuction[depositAddress];
        delete auctionToDeposit[address(auction)];
        earlyCloseAuction(auction);
    }

    /// @notice Cleans up auction and deposit data and executes deposit liquidation.
    /// @dev This function is invoked when Auctioneer determines that an auction
    ///      is eligible to be closed. It cannot be called on-demand outside
    ///      the Auctioneer contract. By the time this function is called, all
    ///      the TBTC tokens for the coverage pool auction should be transferred
    ///      to this contract in order to buy signer bonds.
    /// @param auction Coverage pool auction
    function onAuctionFullyFilled(AuctionMock auction) internal override {
        DepositMock deposit = DepositMock(auctionToDeposit[address(auction)]);

        delete depositToAuction[address(deposit)];
        delete auctionToDeposit[address(auction)];
    }

    function isDepositLiquidationInProgress(DepositMock deposit)
        internal
        view
        returns (bool)
    {
        uint256 state = deposit.currentState();

        return (state == DEPOSIT_LIQUIDATION_IN_PROGRESS_STATE ||
            state == DEPOSIT_FRAUD_LIQUIDATION_IN_PROGRESS_STATE);
    }
}
