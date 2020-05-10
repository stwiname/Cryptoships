pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import './Auction.sol';
import './AuctionLib.sol';
import './GameLib.sol';

contract Game is /*AuctionListener,*/ Ownable {
  using Address for address payable;
  using SafeMath for uint256;
  using SafeMath for uint;
  using GameLib for GameLib.Data;
  using AuctionLib for AuctionLib.Data;


  uint256 withdrawDeadline;

  GameLib.Data data;

  modifier gameRunning() {
    require(data.result == GameLib.Result.UNSET, 'Cannot call this funciton once the game is over');
    _;
  }

  // Duplicate events from GameLib so we can get the abi
  event HighestBidPlaced(GameLib.Team team, address bidder, uint amount, uint16[2] move, uint256 endTime, uint32 auctionIndex);
  event MoveConfirmed(GameLib.Team team, bool hit, uint16[2] move, uint32 auctionIndex);
  event AuctionCreated(GameLib.Team team, uint32 auctionIndex);
  event GameCompleted(GameLib.Team winningTeam);

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

    data.createAuction(startTeam, now/*, this*/);
  }

  // Required in order to transfer funds from Auctions
  receive() external payable { }

  function placeBid(
    uint16[2] memory move,
    GameLib.Team team,
    uint32 auctionIndex
  ) public payable returns(uint256){
    return data.placeBid(move, team, auctionIndex);
  }

  // Gets called by the oracle when the first bid is made for an auction
  function startAuction(GameLib.Team team) public onlyOwner gameRunning returns(AuctionLib.Data memory) {
    return data.startAuction(team/*, this*/);
  }

  function confirmMove(GameLib.Team team, bool hit, uint32 auctionIndex) public onlyOwner {
    return data.confirmMove(team, hit, auctionIndex);
  }

  // TODO find better way to encode the field data 
  function finalize(GameLib.Team winner, bytes32 fieldData, bytes32 salt) public onlyOwner gameRunning {
    data.finalize(winner, fieldData, salt);

    withdrawDeadline = block.timestamp + 604800; // 7 Days
  }

  function withdraw() public {
    require(block.timestamp < withdrawDeadline, "Withdrawing winnings has now closed");
    return data.withdraw();
  }

  function withdrawRemainder(address payable dest) public onlyOwner {
    require(block.timestamp > withdrawDeadline, "Cannot withdraw remainder early");

    dest.sendValue(address(this).balance);
  }

  function hasMoveBeenMade(GameLib.Team team, uint16[2] memory move) public view returns (bool) {
    return data.hasMoveBeenMade(team, move);
  }

  function getCurrentAuction(GameLib.Team team) public view returns(AuctionLib.Data memory) {
    return data.getCurrentAuction(team);
  }

  function getAuctionsCount(GameLib.Team team) public view returns(uint32) {
    return data.getAuctionsCount(team);
  }

  function getCurrentAuctionIndex(GameLib.Team team) public view returns(uint32) {
    return data.getCurrentAuctionIndex(team);
  }

  function getAuctionByIndex(GameLib.Team team, uint32 index) public view returns(AuctionLib.Data memory) {
    return data.getAuctionByIndex(team, index);
  }

  function createAuction(GameLib.Team team, uint256 startTime) private returns(AuctionLib.Data memory) {
    return data.createAuction(team, startTime/*, this*/);
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

  function getResult() public view returns(GameLib.Result) {
    return data.result;
  }

  function getFieldSize() public view returns(uint16) {
    return data.fieldSize;
  }

  function getWithdrawDeadline() public view returns(uint256) {
    return withdrawDeadline;
  }

  function hasAuctionEnded(GameLib.Team team, uint32 index) public view returns (bool) {
    AuctionLib.Data storage auction = data.getAuctionByIndex(team, index);

    return auction.hasEnded();
  }
}