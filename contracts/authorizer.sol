// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.3.2 (token/ERC20/ERC20.sol)

pragma solidity ^0.8.2;

contract authorizer {
    mapping(address => bool) public authorizedAddresses;
    address public owner;

    event AuthorizedAddress(address);
    event BlacklistedAddress(address);

    constructor () {
        owner = msg.sender;
    }

    function AuthorizeAddress(address _address) external onlyOwner  {
        authorizedAddresses[_address] = true;
        emit AuthorizedAddress(_address);
    }

    function BlacklistAddress(address _address) external onlyOwner {
        authorizedAddresses[_address] = false;
        emit BlacklistedAddress(_address);
    }

    function isExecutionAuthorized(address target, uint256 value, bytes memory calldatas) external view returns(bool) {
        return authorizedAddresses[target];
    }

    modifier onlyOwner() {
        require(owner == msg.sender, "You are not the owner!");
        _;
    }
}