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

import "./AssetPoolMock.sol";
import "./CoveragePoolConstants.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title Coverage Pool
/// @notice A contract that manages a single asset pool. Handles approving and
///         unapproving of risk managers and allows them to seize funds from the
///         asset pool if they are approved.
/// @dev Coverage pool contract is owned by the governance. Coverage pool is the
///      owner of the asset pool contract.
contract CoveragePoolMock is Ownable {
    AssetPoolMock public immutable assetPool;
    IERC20 public immutable collateralToken;

    constructor(AssetPoolMock _assetPool) {
        assetPool = _assetPool;
        collateralToken = _assetPool.collateralToken();
    }

    /// @notice Seizes funds from the coverage pool and puts them aside for the
    ///         recipient to withdraw.
    /// @dev `portionToSeize` value was multiplied by `FLOATING_POINT_DIVISOR`
    ///      for calculation precision purposes. Further calculations in this
    ///      function will need to take this divisor into account.
    /// @param recipient Address that will receive the pool's seized funds
    /// @param portionToSeize Portion of the pool to seize in the range (0, 1]
    ///        multiplied by `FLOATING_POINT_DIVISOR`
    function seizeFunds(address recipient, uint256 portionToSeize) external {
        // require(
        //     portionToSeize > 0 &&
        //         portionToSeize <= CoveragePoolConstants.FLOATING_POINT_DIVISOR,
        //     "Portion to seize is not within the range (0, 1]"
        // );
        // assetPool.claim(recipient, amountToSeize(portionToSeize));
    }

    /// @notice Calculates amount of tokens to be seized from the coverage pool.
    /// @param portionToSeize Portion of the pool to seize in the range (0, 1]
    ///        multiplied by FLOATING_POINT_DIVISOR
    function amountToSeize(uint256 portionToSeize)
        public
        view
        returns (uint256)
    {
        return
            (collateralToken.balanceOf(address(assetPool)) * portionToSeize) /
            CoveragePoolConstants.FLOATING_POINT_DIVISOR;
    }
}
