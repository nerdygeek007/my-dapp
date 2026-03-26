// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract DynamicAvatar is ERC721URIStorage {
    uint256 private _nextTokenId;

    constructor() ERC721("Dynamic Avatar Identity", "DAI") {}

    function mintAvatar(string memory uri) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _mint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);
        return tokenId;
    }
}
