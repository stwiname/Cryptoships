pragma solidity ^0.5.5;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import './Auction.sol';
import './AuctionListener.sol';

import './GameLib.sol';

contract Game is AuctionListener {
  using Address for address payable;
  using SafeMath for uint256;
  using SafeMath for uint;
  using GameLib for GameLib.Data;

  GameLib.Data data;

  address payable owner;

  modifier ownerOnly(){
    require(msg.sender == owner, 'Only the owner can call this');
    _;
  }

  modifier gameRunning() {
    require(data.result == GameLib.Result.UNSET, 'Cannot call this funciton once the game is over');
    _;
  }

  modifier currentAuctions() {
    require(
      address(data.getCurrentAuction(GameLib.Team.RED)) == msg.sender ||
      address(data.getCurrentAuction(GameLib.Team.BLUE)) == msg.sender,
      "This can only be called from current auctions"
    );
    _;
  }

  /*
   * Field hash is a Keccak-256 hash of a 2d array with the unit locations + a salt (probably a timestamp)
   */
  constructor(
    bytes32 _redFieldHash,
    bytes32 _blueFieldHash,
    uint16 _fieldSize,
    uint _fieldUnits,
    uint256 _auctionDuration,
    GameLib.Team startTeam
  ) public {
    require(_fieldSize * _fieldSize > _fieldUnits, "Cannot have more units that spaces available");
    data.fieldHashes[uint(GameLib.Team.RED)] = _redFieldHash;
    data.fieldHashes[uint(GameLib.Team.BLUE)] = _blueFieldHash;
    data.fieldSize = _fieldSize;
    data.fieldUnits = _fieldUnits;
    data.auctionDuration = _auctionDuration;
    owner = msg.sender;

    data.createAuction(startTeam, now, this);
  }

  // Required in order to transfer funds from Auctions
  function() external payable { }

  /*****************************
   * AuctionListener methods
   *****************************/
  function bidPlaced(uint16[2] calldata move, uint amount, address sender, uint256 endTime) external currentAuctions {
    return data.bidPlaced(move, amount, sender, endTime);
  }

  function isMoveInField(uint16[2] memory move) public view returns(bool) {
    return data.isMoveInField(move);
  }

  function isValidMove(uint16[2] calldata move) external currentAuctions view returns(bool) {
    return data.isValidMove(move);
  }

  /*****************************
   * AuctionListener methods end
   *****************************/

  // Gets called by the oracle when the first bid is made for an auction
  function startAuction(GameLib.Team team) public ownerOnly gameRunning returns(Auction) {
    return data.startAuction(team, this);
  }

  function confirmMove(GameLib.Team team, bool hit, address auctionAddress) public ownerOnly {
    return data.confirmMove(team, hit, auctionAddress, this);
  }

  // TODO find better way to encode the field data 
  function finalize(GameLib.Team winner, bytes32 fieldData, bytes32 salt) public ownerOnly gameRunning {
    return data.finalize(winner, fieldData, salt);
  }

  function withdraw() public {
    return data.withdraw();
  }

  function hasMoveBeenMade(GameLib.Team team, uint16[2] memory move) public view returns (bool) {
    return data.hasMoveBeenMade(team, move);
  }

  function getCurrentAuction(GameLib.Team team) public view returns(Auction) {
    return data.getCurrentAuction(team);
  }

  function getAuctionsCount(GameLib.Team team) public view returns(uint32) {
    return data.getAuctionsCount(team);
  }

  function getAuctionByIndex(GameLib.Team team, uint32 index) public view returns(Auction) {
    return data.getAuctionByIndex(team, index);
  }

  function createAuction(GameLib.Team team, uint256 startTime) private returns(Auction) {
    return data.createAuction(team, startTime, this);
  }

  // Cant use lib function for some reason https://github.com/ethereum-ts/TypeChain/issues/216
  function otherTeam(GameLib.Team team) public pure returns(GameLib.Team) {
    return team == GameLib.Team.BLUE ? GameLib.Team.RED : GameLib.Team.BLUE;
  }

  function getRewardPool(GameLib.Team team) public view returns(uint) {
    return data.getRewardPool(team);
  }

  function getPotentialWinnings(address player, GameLib.Team team) public view returns(uint) {
    return data.getPotentialWinnings(player, team);
  }

  function hasWithdrawnWinnings() public view returns(bool) {
    return data.hasWithdrawnWinnings();
  }
}