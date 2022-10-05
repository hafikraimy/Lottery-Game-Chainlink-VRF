//SPDX-License-Identifier:MIT
pragma solidity^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";

contract RandomWinnerGame is VRFConsumerBase, Ownable {
    uint public LINKFee;
    bytes32 public keyHash;
    uint entryFee;
    address[] public players;
    uint maxPlayers;
    bool public gameStarted;
    bool public gameEnded;
    uint public gameId;

    event GameStarted(uint gameId, uint maxPlayers, uint entryFee);
    event GameEnded(uint gameId, address winner, bytes32 requestId);
    event PlayerJoined(uint gameId, address player);

    constructor(
        address vrfCoordinator, 
        address linkToken, 
        bytes32 vrfKeyHash, 
        uint256 vrfFee) VRFConsumerBase(vrfCoordinator, linkToken) {
            keyHash = vrfKeyHash;
            LINKFee = vrfFee;
            gameStarted = false;
    }
    
    function startGame(uint _maxPlayers, uint _entryFee) public onlyOwner {
        require(!gameStarted, "Game has already started");
        // empty players data
        delete players;
        gameStarted = true;
        entryFee = _entryFee;
        maxPlayers = _maxPlayers;
        gameId += 1;

        emit GameStarted(gameId, maxPlayers, entryFee);
    }

    function joinGame() public payable {
        require(gameStarted, "Game has not been started yet");
        require(msg.value == entryFee, "Ether sent is not equal to entry fee");
        require(players.length < maxPlayers, "game is full");
        players.push(msg.sender);
        emit PlayerJoined(gameId, msg.sender);
       
        if(players.length == maxPlayers) {
            getRandomWinner();
        }

    }

    function fulfillRandomness(bytes32 requestId, uint256 randomness) internal virtual override {
        uint256 winnerIndex = randomness % players.length;
        address winner = players[winnerIndex];
        (bool sent, ) = winner.call{value: address(this).balance}("");
        require(sent, "Failed to sent Ether");
        emit GameEnded(gameId, winner, requestId);
        gameStarted = false;
    }

    function getRandomWinner() private returns (bytes32 requestId) {
        // LINK is an internal interface found within VRFConsumerBase
        // make sure our contract has enough Link to request the VRFCoordinator for randomness
        require(LINK.balanceOf(address(this)) >= LINKFee, "Not enough LINK");
        // make a request to VRF Coordinator
        // requestRandomness is a function within VRFConsumerBase
        return requestRandomness(keyHash, LINKFee);
    }

    receive() external payable {}
    fallback() external payable {}

}