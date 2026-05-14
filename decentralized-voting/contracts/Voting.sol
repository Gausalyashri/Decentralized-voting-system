// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Voting {
    struct Proposal {
        string description;
        uint voteCount;
    }

    address public admin;
    mapping(address => bool) public whitelist;
    Proposal[] public proposals;
    mapping(address => mapping(uint => bool)) public hasVoted;
    uint public votingDeadline;

    event ProposalCreated(uint proposalId, string description);
    event Voted(address voter, uint proposalId);

    constructor(uint _durationMinutes) {
        admin = msg.sender;
        votingDeadline = block.timestamp + (_durationMinutes * 1 minutes);
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    modifier onlyWhitelisted() {
        require(whitelist[msg.sender], "Not whitelisted");
        _;
    }

    modifier beforeDeadline() {
        require(block.timestamp < votingDeadline, "Voting ended");
        _;
    }

    function addToWhitelist(address _voter) external onlyAdmin {
        whitelist[_voter] = true;
    }

    function createProposal(string memory _description) external onlyAdmin {
        proposals.push(Proposal(_description, 0));
        emit ProposalCreated(proposals.length - 1, _description);
    }

    function vote(uint _proposalId) external onlyWhitelisted beforeDeadline {
        require(!hasVoted[msg.sender][_proposalId], "Already voted");
        proposals[_proposalId].voteCount++;
        hasVoted[msg.sender][_proposalId] = true;
        emit Voted(msg.sender, _proposalId);
    }

    function getProposals() external view returns (Proposal[] memory) {
        return proposals;
    }
}