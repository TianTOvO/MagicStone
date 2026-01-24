// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IERC721 {
    function ownerOf(uint256 tokenId) external view returns (address);
}

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
}

contract Quest is Ownable {
    enum QuestType { Daily, Achievement, Treasure, Team }

    struct QuestInfo {
        QuestType questType;
        string description;
        uint256 reward;
        bool active;
    }

    struct UserQuestProgress {
        uint256 questId;
        uint256 progress;
        bool completed;
        uint256 claimedAt;
    }

    IERC20 public token;
    QuestInfo[] public quests;
    mapping(address => mapping(uint256 => UserQuestProgress)) public userProgress;
    mapping(address => uint256[]) public userQuestIds;

    event QuestCreated(uint256 indexed questId, QuestType questType, uint256 reward);
    event QuestCompleted(address indexed user, uint256 indexed questId);
    event RewardClaimed(address indexed user, uint256 indexed questId, uint256 reward);

    constructor(address _token) Ownable(msg.sender) {
        token = IERC20(_token);
    }

    function createQuest(
        QuestType questType,
        string memory description,
        uint256 reward
    ) external onlyOwner {
        quests.push(QuestInfo(questType, description, reward, true));
        emit QuestCreated(quests.length - 1, questType, reward);
    }

    function assignQuestToUser(address user, uint256 questId) external onlyOwner {
        require(questId < quests.length, "Invalid quest");
        require(quests[questId].active, "Quest not active");

        userQuestIds[user].push(questId);
        userProgress[user][questId] = UserQuestProgress(questId, 0, false, 0);
    }

    function updateProgress(address user, uint256 questId, uint256 increment) external onlyOwner {
        require(questId < quests.length, "Invalid quest");
        UserQuestProgress storage progress = userProgress[user][questId];
        progress.progress += increment;

        // Simple completion logic: if progress >= 1 (one completion), mark as complete
        if (progress.progress >= 1 && !progress.completed) {
            progress.completed = true;
            emit QuestCompleted(user, questId);
        }
    }

    function claimReward(uint256 questId) external {
        UserQuestProgress storage progress = userProgress[msg.sender][questId];
        require(progress.completed, "Quest not completed");
        require(progress.claimedAt == 0, "Already claimed");

        progress.claimedAt = block.timestamp;
        uint256 reward = quests[questId].reward;

        require(token.transfer(msg.sender, reward), "Token transfer failed");
        emit RewardClaimed(msg.sender, questId, reward);
    }

    function getQuestCount() external view returns (uint256) {
        return quests.length;
    }
}
