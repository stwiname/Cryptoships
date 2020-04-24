pragma solidity ^0.5.5;


import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import './Auction.sol';
import './AuctionListener.sol';

library GameLib {

  using Address for address payable;
  using SafeMath for uint256;
  using SafeMath for uint;

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
    mapping(uint32 => Auction)[2] auctions;
    uint32[2] auctionsCount;
  }

  event HighestBidPlaced(Team team, address bidder, uint amount, uint16[2] move, uint256 endTime);
  event MoveConfirmed(Team team, bool hit, uint16[2] move, address auctionAddress);
  event AuctionCreated(Team team, address auctionAddress);
  event GameCompleted(Team winningTeam);

  /*****************************
   * AuctionListener methods
   *****************************/

  function bidPlaced(Data storage data, uint16[2] calldata move, uint amount, address sender, uint256 endTime) external {
    Team team = address(getCurrentAuction(data, Team.RED)) == msg.sender ? Team.RED : Team.BLUE;
    emit HighestBidPlaced(team, sender, amount, move, endTime);
  }

  function isMoveInField(Data storage data, uint16[2] memory move) public view returns(bool) {
    return move[0] < data.fieldSize && move[1] < data.fieldSize;
  }

  function isValidMove(Data storage data, uint16[2] calldata move) external view returns(bool) {
    Team team = address(getCurrentAuction(data, Team.RED)) == msg.sender ? Team.RED : Team.BLUE;
    return isMoveInField(data, move) && !hasMoveBeenMade(data, team, move);
  }

  /*****************************
   * AuctionListener methods end
   *****************************/

   // Gets called by the oracle when the first bid is made for an auction
  function startAuction(Data storage data, Team team, AuctionListener listener) public returns(Auction) {

    // We might be starting the first auction for the team
    if (data.auctionsCount[uint(team)] > 0) {
      require(
        getCurrentAuction(data, team).hasEnded(),
        "Cannot start an auction while one is already running"
      );
    }

    Auction otherAuction = getCurrentAuction(data, otherTeam(team));

    require(
      otherAuction.getEndTime() > 0,
      "First bid must be made on other auction first"
    );

    return createAuction(data, team, otherAuction.getEndTime() - data.auctionDuration/2, listener);
  }


  function confirmMove(Data storage data, Team team, bool hit, address auctionAddress, AuctionListener listener) public {
    Auction auction = auctionAddress == address(0)
      ? getCurrentAuction(data, team)
      : Auction(auctionAddress);

    auction.setResult(hit);

    // Withdraw funds to make it easier when finalising 
    auction.withdrawFunds();

    // This auction has finished but the othe team has none,
    // we can now create it though
    if (data.auctionsCount[uint(otherTeam(team))] <= 0) {
      startAuction(data, otherTeam(team), listener);
    }

    Auction otherAuction = getCurrentAuction(data, otherTeam(team));

    // Auction has ended or has had a bid (has an end time)
    if ((otherAuction.hasEnded() || otherAuction.getEndTime() > 0)
        // Only start auction if we're confirming the currentAuction
        && address(auction) == address(getCurrentAuction(data, team))
    ) {
      // Start the next auction
      startAuction(data, team, listener);
    }

    emit MoveConfirmed(team, hit, auction.getLeadingMove(), address(auction));
  }

  function finalize(Data storage data, Team winner, bytes32 fieldData, bytes32 salt) public {
    require(
      keccak256(abi.encodePacked(fieldData, salt)) == data.fieldHashes[uint(winner)],
      'Invalid verification of field'
    );

    data.result = winner == Team.RED ? Result.RED_WINNER : Result.BLUE_WINNER;

    /* Set the current auction as a hit, */
    Auction currentAuction = getCurrentAuction(data, winner);
    if (currentAuction.hasEnded() && currentAuction.getResult() == AuctionLib.Result.UNSET)  {
      currentAuction.setResult(true);
    }

    /* Stop current auction of losing team, return funds to latest bidder */
    Auction losingAuction = getCurrentAuction(data, otherTeam(winner));
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
      Auction auction = data.auctions[teamId][i];

      // Move isnt considered made if the auction has not ended
      if (!auction.hasEnded()) {
        continue;
      }

      (address bidder, , uint16[2] memory leadingMove) = auction.getLeadingBid();

      if (bidder != address(0) && leadingMove[0] == move[0] && leadingMove[1] == move[1]) {
        return true;
      }
    }

    return false;
  }

  function getCurrentAuction(Data storage data, Team team) public view returns(Auction) {
    uint32 count = getAuctionsCount(data, team);
    require(count > 0, "No auction exists for this team");

    uint teamId = uint(team);

    return data.auctions[teamId][count - 1];
  }

  function getAuctionsCount(Data storage data, Team team) public view returns(uint32) {
    uint teamId = uint(team);

    return data.auctionsCount[teamId];
  }

  function getAuctionByIndex(Data storage data, Team team, uint32 index) public view returns(Auction) {
    uint teamId = uint(team);

    return data.auctions[teamId][index];
  }

  function createAuction(Data storage data, Team team, uint256 startTime, AuctionListener listener) internal returns(Auction) {
    uint teamId = uint(team);

    data.auctionsCount[teamId] ++;
    Auction auction = data.auctions[teamId][data.auctionsCount[teamId]-1] = new Auction(startTime, data.auctionDuration, listener);
    emit AuctionCreated(team, address(auction));
    return auction;
  }

  function otherTeam(Team team) internal pure returns(Team) {
    return team == Team.BLUE ? Team.RED : Team.BLUE;
  }

  function getRewardPool(Data storage data, Team team) public view returns(uint) {
    uint rewardPool = 0;
    for (uint32 i = 0; i < getAuctionsCount(data, team); i++) {
      (, uint256 amount, ) = getAuctionByIndex(data, team, i).getLeadingBid();
      rewardPool += amount;
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
    (, uint256 leadingAmount,) = getCurrentAuction(data, team).getLeadingBid();
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
      (address payable bidder, uint256 amount,) = getAuctionByIndex(data, team, i).getLeadingBid();

      if (bidder == player) {
        reward += rewardPerMove + amount;
      }
    }

    return reward;
  }

  function hasWithdrawnWinnings(Data storage data) public view returns(bool) {
    return data.withdrawn[msg.sender];
  }
}