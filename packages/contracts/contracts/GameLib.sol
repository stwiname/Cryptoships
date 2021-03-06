pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import './Auction.sol';
import './AuctionLib.sol';

library GameLib {

  using Address for address payable;
  using SafeMath for uint256;
  using SafeMath for uint;
  using AuctionLib for AuctionLib.Data;

  enum Result {
    UNSET,
    RED_WINNER,
    BLUE_WINNER,
    ABORTED
  }

  enum Team {
    RED,
    BLUE
  }

  struct Data {
    mapping(uint => bytes32) fieldHashes;
    mapping(address => bool) withdrawn;
    uint16 fieldSize;
    uint fieldUnits;
    Result result;
    uint256 auctionDuration;

    /*
     * Auctions support a max dimension of 2^16
     * So we need to support at least 2^16 * 2 moves
     */
    mapping(uint32 => AuctionLib.Data)[2] auctions;
    uint32[2] auctionsCount;
  }

  event HighestBidPlaced(Team team, address bidder, uint amount, uint16[2] move, uint256 endTime, uint32 auctionIndex);
  event MoveConfirmed(Team team, bool hit, uint16[2] move, uint32 auctionIndex);
  event AuctionCreated(Team team, uint32 auctionIndex);
  event GameCompleted(Team winningTeam);

  function isMoveInField(Data storage data, uint16[2] memory move) public view returns(bool) {
    return move[0] < data.fieldSize && move[1] < data.fieldSize;
  }

  function isValidMove(Data storage data, uint16[2] memory move, Team team) private view returns(bool) {
    return isMoveInField(data, move) && !hasMoveBeenMade(data, team, move);
  }

  function placeBid(
    Data storage data,
    uint16[2] memory move,
    Team team,
    uint32 auctionIndex
  ) public returns(uint256){

    require(isValidMove(data, move, team), "Move is out of field bounds");

    AuctionLib.Data storage auction = getAuctionByIndex(data, team, auctionIndex);

    uint256 endTime = auction.placeBid(move);

    uint32 otherCount = getAuctionsCount(data, otherTeam(team));
    if (otherCount == 0) {
      startAuction(data, otherTeam(team));
    } else {
      AuctionLib.Data storage otherAuction = getCurrentAuction(data, otherTeam(team));

      if (otherAuction.hasEnded()) {
        startAuction(data, otherTeam(team));
      }
    }

    emit HighestBidPlaced(team, msg.sender, msg.value, move, endTime, auctionIndex);

    return endTime;
  }

   // Gets called by the oracle when the first bid is made for an auction
  function startAuction(Data storage data, Team team) public returns(AuctionLib.Data memory) {
    // We might be starting the first auction for the team
    if (data.auctionsCount[uint(team)] > 0) {
      require(
        getCurrentAuction(data, team).hasEnded(),
        "Cannot start an auction while one is already running"
      );
    }

    AuctionLib.Data memory otherAuction = getCurrentAuction(data, otherTeam(team));

    require(
      otherAuction.endTime > 0,
      "First bid must be made on other auction first"
    );

    return createAuction(data, team, otherAuction.endTime - data.auctionDuration/2);
  }

  function confirmMove(Data storage data, Team team, bool hit, uint32 auctionIndex) public {
    AuctionLib.Data storage auction = getAuctionByIndex(data, team, auctionIndex);

    auction.setResult(hit);

    // This auction has finished but the othe team has none,
    // we can now create it though
    if (data.auctionsCount[uint(otherTeam(team))] <= 0) {
      startAuction(data, otherTeam(team));
    }

    AuctionLib.Data storage otherAuction = getCurrentAuction(data, otherTeam(team));

    // Auction has ended or has had a bid (has an end time)
    if ((otherAuction.hasEnded() || otherAuction.endTime > 0)
        // Only start auction if we're confirming the currentAuction
        && auctionIndex == getAuctionsCount(data, team) - 1
    ) {
      // Start the next auction
      startAuction(data, team);
    }

    emit MoveConfirmed(team, hit, auction.leadingBid.move, auctionIndex);
  }

  function finalize(Data storage data, Team winner, bytes32 fieldData, bytes32 salt) public {
    require(
      keccak256(abi.encodePacked(fieldData, salt)) == data.fieldHashes[uint(winner)],
      'Invalid verification of field'
    );

    data.result = winner == Team.RED ? Result.RED_WINNER : Result.BLUE_WINNER;

    /* Set the current auction as a hit, */
    AuctionLib.Data storage currentAuction = getCurrentAuction(data, winner);
    if (currentAuction.hasEnded() && currentAuction.result == AuctionLib.Result.UNSET)  {
      currentAuction.setResult(true);
    }

    /* Stop current auction of losing team, return funds to latest bidder */
    AuctionLib.Data storage losingAuction = getCurrentAuction(data, otherTeam(winner));
    losingAuction.cancel();

    emit GameCompleted(winner);

    // Users should be able to withdraw their winnings now
  }

  function withdraw(Data storage data) public {
    require(data.result == Result.RED_WINNER || data.result == Result.BLUE_WINNER, 'Game must be completed first');
    require(!data.withdrawn[msg.sender], 'Cannot withdraw multiple times');

    Team winningTeam = data.result == Result.RED_WINNER ? Team.RED : Team.BLUE;

    uint winnings = getPotentialWinnings(data, msg.sender, winningTeam);

    if (winnings == 0) {
      return;
    }

    data.withdrawn[msg.sender] = true;

    msg.sender.sendValue(winnings);
  }

  function hasMoveBeenMade(Data storage data, Team team, uint16[2] memory move) public view returns (bool) {
    uint teamId = uint(team);

    for(uint32 i = 0; i < data.auctionsCount[teamId]; i++) {
      AuctionLib.Data storage auction = getAuctionByIndex(data, team, i);

      // Move isnt considered made if the auction has not ended
      if (!auction.hasEnded()) {
        continue;
      }

      AuctionLib.Bid memory bid = auction.leadingBid;

      if (bid.bidder != address(0) && bid.move[0] == move[0] && bid.move[1] == move[1]) {
        return true;
      }
    }

    return false;
  }

  function getAuctionsCount(Data storage data, Team team) public view returns(uint32) {
    uint teamId = uint(team);

    return data.auctionsCount[teamId];
  }

  function getCurrentAuctionIndex(Data storage data, Team team) public view returns(uint32) {
    uint32 count = getAuctionsCount(data, team);

    require(count > 0, "No auctions exist for this team");
    return count - 1;
  }

  function getCurrentAuction(Data storage data, Team team) public view returns(AuctionLib.Data storage) {
    uint32 count = getAuctionsCount(data, team);
    require(count > 0, "No auction exists for this team");

    return getAuctionByIndex(data, team, count - 1);
  }

  function getAuctionByIndex(Data storage data, Team team, uint32 index) public view returns(AuctionLib.Data storage) {
    uint teamId = uint(team);

    return data.auctions[teamId][index];
  }

  function createAuction(Data storage data, Team team, uint256 startTime) internal returns(AuctionLib.Data memory) {
    uint teamId = uint(team);

    AuctionLib.Data memory auction = AuctionLib.Data({
      startTime: startTime,
      endTime: 0,
      duration: data.auctionDuration,
      result: AuctionLib.Result.UNSET,
      leadingBid: AuctionLib.Bid({
        bidder: address(0),
        amount: 0,
        move: [uint16(0), uint16(0)]
      })
    });

    data.auctionsCount[teamId] ++;
    uint32 auctionIndex = data.auctionsCount[teamId]-1;
    data.auctions[teamId][auctionIndex] = auction;
    emit AuctionCreated(team, auctionIndex);
    return auction;
  }

  function otherTeam(Team team) internal pure returns(Team) {
    return team == Team.BLUE ? Team.RED : Team.BLUE;
  }

  function getRewardPool(Data storage data, Team team) public view returns(uint) {
    uint rewardPool = 0;
    for (uint32 i = 0; i < getAuctionsCount(data, team); i++) {
      rewardPool += getAuctionByIndex(data, team, i).leadingBid.amount;
    }

    return rewardPool;
  }

  function getPotentialWinnings(Data storage data, address player, Team team) public view returns(uint) {
    // Calculate total amount of rewards
    uint rewardPool = getRewardPool(data, otherTeam(team));

    // Get num valid auctions, if the last auction has zero bid it is either not played or cancelled
    uint32 numAuctions = getAuctionsCount(data, team);

    if (numAuctions <= 0) {
      return 0;
    }

    // Exclude current auction if no bids made
    uint256 leadingAmount = getCurrentAuction(data, team).leadingBid.amount;
    if (leadingAmount <= 0) {
      numAuctions--;
    }

    if (numAuctions <= 0) {
      return 0;
    }

    // Save 10% for owner
    // TODO see if percentage covers oracle costs
    uint rewardPerMove = rewardPool.div(10).mul(9).div(numAuctions);

    uint reward = 0;
    /* Return move cost + reward to each player on the winning team */
    for (uint32 i = 0; i < numAuctions; i++) {
      AuctionLib.Bid memory bid = getAuctionByIndex(data, team, i).leadingBid;

      if (bid.bidder == player) {
        reward += rewardPerMove + bid.amount;
      }
    }

    return reward;
  }

  function hasWithdrawnWinnings(Data storage data) public view returns(bool) {
    return data.withdrawn[msg.sender];
  }
}