// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract DecentralizedVoting is Ownable, ReentrancyGuard {

    struct Candidate {
        uint256 id;
        string name;
        string party;
        string description;
        string imageUrl;
        uint256 voteCount;
        bool isActive;
    }

    struct Election {
        uint256 id;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        bool resultsPublished;
        uint256 totalVotes;
        uint256[] candidateIds;
    }

    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint256 votedCandidateId;
        uint256 registeredAt;
    }

    uint256 private _electionCounter;
    uint256 private _candidateCounter;

    mapping(uint256 => Election) public elections;
    mapping(uint256 => mapping(uint256 => Candidate)) public candidates;
    mapping(uint256 => mapping(address => Voter)) public voters;

    event ElectionCreated(uint256 indexed electionId, string title, uint256 startTime, uint256 endTime);
    event CandidateAdded(uint256 indexed electionId, uint256 indexed candidateId, string name);
    event VoterRegistered(uint256 indexed electionId, address indexed voter);
    event VoteCast(uint256 indexed electionId, address indexed voter, uint256 indexed candidateId);
    event ResultsPublished(uint256 indexed electionId, uint256 winnerCandidateId);
    event ElectionStatusUpdated(uint256 indexed electionId, bool isActive);

    modifier electionExists(uint256 _electionId) {
        require(_electionId > 0 && _electionId <= _electionCounter, "Election does not exist");
        _;
    }

    modifier electionActive(uint256 _electionId) {
        Election storage election = elections[_electionId];
        require(election.isActive, "Election is not active");
        require(block.timestamp >= election.startTime, "Election has not started yet");
        require(block.timestamp <= election.endTime, "Election has ended");
        _;
    }

    modifier onlyRegisteredVoter(uint256 _electionId) {
        require(voters[_electionId][msg.sender].isRegistered, "Voter is not registered for this election");
        _;
    }

    constructor() Ownable(msg.sender) {}

    function createElection(string calldata _title, string calldata _description, uint256 _startTime, uint256 _endTime) external onlyOwner returns (uint256) {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(_startTime >= block.timestamp, "Start time must be in the future");
        require(_endTime > _startTime, "End time must be after start time");

        _electionCounter++;
        uint256 electionId = _electionCounter;

        elections[electionId] = Election({
            id: electionId,
            title: _title,
            description: _description,
            startTime: _startTime,
            endTime: _endTime,
            isActive: true,
            resultsPublished: false,
            totalVotes: 0,
            candidateIds: new uint256[](0)
        });

        emit ElectionCreated(electionId, _title, _startTime, _endTime);
        return electionId;
    }

    function toggleElectionStatus(uint256 _electionId) external onlyOwner electionExists(_electionId) {
        elections[_electionId].isActive = !elections[_electionId].isActive;
        emit ElectionStatusUpdated(_electionId, elections[_electionId].isActive);
    }

    function publishResults(uint256 _electionId) external onlyOwner electionExists(_electionId) {
        Election storage election = elections[_electionId];
        require(block.timestamp > election.endTime || !election.isActive, "Election is still ongoing");
        require(!election.resultsPublished, "Results already published");
        election.resultsPublished = true;
        uint256 winnerId = getWinner(_electionId);
        emit ResultsPublished(_electionId, winnerId);
    }

    function addCandidate(uint256 _electionId, string calldata _name, string calldata _party, string calldata _description, string calldata _imageUrl) external onlyOwner electionExists(_electionId) returns (uint256) {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(block.timestamp < elections[_electionId].startTime, "Cannot add candidates after election has started");

        _candidateCounter++;
        uint256 candidateId = _candidateCounter;

        candidates[_electionId][candidateId] = Candidate({
            id: candidateId,
            name: _name,
            party: _party,
            description: _description,
            imageUrl: _imageUrl,
            voteCount: 0,
            isActive: true
        });

        elections[_electionId].candidateIds.push(candidateId);
        emit CandidateAdded(_electionId, candidateId, _name);
        return candidateId;
    }

    function registerVoter(uint256 _electionId, address _voter) external onlyOwner electionExists(_electionId) {
        require(_voter != address(0), "Invalid voter address");
        require(!voters[_electionId][_voter].isRegistered, "Voter already registered");
        require(block.timestamp < elections[_electionId].endTime, "Cannot register after election ends");

        voters[_electionId][_voter] = Voter({
            isRegistered: true,
            hasVoted: false,
            votedCandidateId: 0,
            registeredAt: block.timestamp
        });

        emit VoterRegistered(_electionId, _voter);
    }

    function registerVotersBatch(uint256 _electionId, address[] calldata _voters) external onlyOwner electionExists(_electionId) {
        require(block.timestamp < elections[_electionId].endTime, "Cannot register after election ends");
        for (uint256 i = 0; i < _voters.length; i++) {
            address voter = _voters[i];
            if (voter != address(0) && !voters[_electionId][voter].isRegistered) {
                voters[_electionId][voter] = Voter({ isRegistered: true, hasVoted: false, votedCandidateId: 0, registeredAt: block.timestamp });
                emit VoterRegistered(_electionId, voter);
            }
        }
    }

    function vote(uint256 _electionId, uint256 _candidateId) external nonReentrant electionExists(_electionId) electionActive(_electionId) onlyRegisteredVoter(_electionId) {
        Voter storage voter = voters[_electionId][msg.sender];
        require(!voter.hasVoted, "Voter has already voted");
        Candidate storage candidate = candidates[_electionId][_candidateId];
        require(candidate.id != 0, "Candidate does not exist");
        require(candidate.isActive, "Candidate is not active");

        voter.hasVoted = true;
        voter.votedCandidateId = _candidateId;
        candidate.voteCount++;
        elections[_electionId].totalVotes++;

        emit VoteCast(_electionId, msg.sender, _candidateId);
    }

    function getCandidates(uint256 _electionId) external view electionExists(_electionId) returns (Candidate[] memory) {
        uint256[] storage candidateIds = elections[_electionId].candidateIds;
        Candidate[] memory result = new Candidate[](candidateIds.length);
        for (uint256 i = 0; i < candidateIds.length; i++) {
            result[i] = candidates[_electionId][candidateIds[i]];
        }
        return result;
    }

    function getWinner(uint256 _electionId) public view electionExists(_electionId) returns (uint256 winnerId) {
        uint256[] storage candidateIds = elections[_electionId].candidateIds;
        require(candidateIds.length > 0, "No candidates in election");
        uint256 highestVotes = 0;
        winnerId = candidateIds[0];
        for (uint256 i = 0; i < candidateIds.length; i++) {
            uint256 cId = candidateIds[i];
            if (candidates[_electionId][cId].voteCount > highestVotes) {
                highestVotes = candidates[_electionId][cId].voteCount;
                winnerId = cId;
            }
        }
    }

    function getVoterInfo(uint256 _electionId, address _voter) external view returns (bool, bool, uint256) {
        Voter storage voter = voters[_electionId][_voter];
        return (voter.isRegistered, voter.hasVoted, voter.votedCandidateId);
    }

    function getTotalElections() external view returns (uint256) { return _electionCounter; }

    function getElection(uint256 _electionId) external view electionExists(_electionId) returns (Election memory) { return elections[_electionId]; }

    function isVotingOpen(uint256 _electionId) external view electionExists(_electionId) returns (bool) {
        Election storage election = elections[_electionId];
        return (election.isActive && block.timestamp >= election.startTime && block.timestamp <= election.endTime);
    }
}