// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Voting
 * @notice On-chain e-voting with admin-managed candidates and voter registration.
 */
contract Voting {
    struct Candidate {
        uint256 id;
        string name;
        string party;
        uint256 voteCount;
    }

    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint256 votedCandidateId;
    }

    mapping(address => Voter) public voters;
    mapping(uint256 => Candidate) public candidates;

    address public admin;
    uint256 public electionStart;
    uint256 public electionEnd;

    uint256 private candidateCount;

    event VoteCast(address indexed voter, uint256 candidateId);
    event CandidateAdded(uint256 indexed id, string name);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    modifier onlyDuringElection() {
        require(
            block.timestamp >= electionStart && block.timestamp <= electionEnd,
            "Outside election period"
        );
        _;
    }

    modifier onlyRegisteredVoter() {
        require(voters[msg.sender].isRegistered, "Not registered");
        _;
    }

    modifier hasNotVoted() {
        require(!voters[msg.sender].hasVoted, "Already voted");
        _;
    }

    constructor(uint256 _electionStart, uint256 _electionEnd) {
        admin = msg.sender;
        electionStart = _electionStart;
        electionEnd = _electionEnd;
    }

    function addCandidate(string calldata name, string calldata party) external onlyAdmin {
        uint256 id = candidateCount;
        candidates[id] = Candidate({id: id, name: name, party: party, voteCount: 0});
        candidateCount++;
        emit CandidateAdded(id, name);
    }

    function registerVoter(address voter) external onlyAdmin {
        require(!voters[voter].isRegistered, "Already registered");
        voters[voter].isRegistered = true;
    }

    /// @notice Admin can update election window (e.g. before go-live or for demos).
    function setElectionTimes(uint256 _electionStart, uint256 _electionEnd) external onlyAdmin {
        require(_electionStart < _electionEnd, "Invalid election window");
        electionStart = _electionStart;
        electionEnd = _electionEnd;
    }

    function castVote(uint256 candidateId)
        external
        onlyDuringElection
        onlyRegisteredVoter
        hasNotVoted
    {
        require(candidateId < candidateCount, "Invalid candidate");
        voters[msg.sender].hasVoted = true;
        voters[msg.sender].votedCandidateId = candidateId;
        candidates[candidateId].voteCount++;
        emit VoteCast(msg.sender, candidateId);
    }

    function getCandidate(uint256 id) external view returns (Candidate memory) {
        require(id < candidateCount, "Invalid candidate");
        return candidates[id];
    }

    function getCandidateCount() external view returns (uint256) {
        return candidateCount;
    }

    function getWinner() external view returns (Candidate memory) {
        require(block.timestamp > electionEnd, "Election not ended");
        require(candidateCount > 0, "No candidates");
        uint256 maxVotes;
        uint256 winnerId;
        for (uint256 i = 0; i < candidateCount; i++) {
            if (candidates[i].voteCount > maxVotes) {
                maxVotes = candidates[i].voteCount;
                winnerId = i;
            }
        }
        return candidates[winnerId];
    }
}
