pragma solidity ^0.6.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import './Auction.sol';
import './AuctionListener.sol';
import './GameLib.sol';

contract Game is AuctionListener, Ownable {
  using Address for address payable;
  using SafeMath for uint256;
  using SafeMath for uint;
  using GameLib for GameLib.Data;


  uint256 withdrawDeadline;

  GameLib.Data data;

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

  // Duplicate events from GameLib so we can get the abi
  event HighestBidPlaced(GameLib.Team team, address bidder, uint amount, uint16[2] move, uint256 endTime);
  event MoveConfirmed(GameLib.Team team, bool hit, uint16[2] move, address auctionAddress);
  event AuctionCreated(GameLib.Team team, address auctionAddress);
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

    data.createAuction(startTeam, now, this);
  }

  // Required in order to transfer funds from Auctions
  receive() external payable { }

  /*****************************
   * AuctionListener methods
   *****************************/
  function bidPlaced(uint16[2] calldata move, uint amount, address sender, uint256 endTime) external override currentAuctions {
    return data.bidPlaced(move, amount, sender, endTime);
  }

  function isMoveInField(uint16[2] memory move) public view returns(bool) {
    return data.isMoveInField(move);
  }

  function isValidMove(uint16[2] calldata move) external override currentAuctions view returns(bool) {
    return data.isValidMove(move);
  }

  /*****************************
   * AuctionListener methods end
   *****************************/

  // Gets called by the oracle when the first bid is made for an auction
  function startAuction(GameLib.Team team) public onlyOwner gameRunning returns(Auction) {
    return data.startAuction(team, this);
  }

  function confirmMove(GameLib.Team team, bool hit, address auctionAddress) public onlyOwner {
    return data.confirmMove(team, hit, auctionAddress, this);
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

  function getResult() public view returns(GameLib.Result) {
    return data.result;
  }

  function getFieldSize() public view returns(uint16) {
    return data.fieldSize;
  }

  function getWithdrawDeadline() public view returns(uint256) {
    return withdrawDeadline;
  }
}