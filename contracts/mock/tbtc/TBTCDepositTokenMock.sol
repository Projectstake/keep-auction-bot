// SPDX-License-Identifier: MIT

pragma solidity ^0.5.0;

import {
    ERC721Metadata
} from "openzeppelin-solidity/contracts/token/ERC721/ERC721Metadata.sol";
import {DepositFactoryAuthorityMock} from "./DepositFactoryAuthorityMock.sol";

/// @title tBTC Deposit Token for tracking deposit ownership
/// @notice The tBTC Deposit Token, commonly referenced as the TDT, is an
///         ERC721 non-fungible token whose ownership reflects the ownership
///         of its corresponding deposit. Each deposit has one TDT, and vice
///         versa. Owning a TDT is equivalent to owning its corresponding
///         deposit. TDTs can be transferred freely. tBTC's VendingMachine
///         contract takes ownership of TDTs and in exchange returns fungible
///         TBTC tokens whose value is backed 1-to-1 by the corresponding
///         deposit's BTC.
/// @dev Currently, TDTs are minted using the uint256 casting of the
///      corresponding deposit contract's address. That is, the TDT's id is
///      convertible to the deposit's address and vice versa. TDTs are minted
///      automatically by the factory during each deposit's initialization. See
///      DepositFactory.createNewDeposit() for more info on how the TDT is minted.
contract TBTCDepositTokenMock is ERC721Metadata, DepositFactoryAuthorityMock {
    constructor(address _depositFactoryAddress)
        public
        ERC721Metadata("tBTC Deposit Token", "TDT")
    {
        initialize(_depositFactoryAddress);
    }

    /// @dev Mints a new token.
    /// Reverts if the given token ID already exists.
    /// @param _to The address that will own the minted token
    /// @param _tokenId uint256 ID of the token to be minted
    function mint(address _to, uint256 _tokenId) external onlyFactory {
        _mint(_to, _tokenId);
    }

    /// @dev Returns whether the specified token exists.
    /// @param _tokenId uint256 ID of the token to query the existence of.
    /// @return bool whether the token exists.
    function exists(uint256 _tokenId) external view returns (bool) {
        return _exists(_tokenId);
    }
}
