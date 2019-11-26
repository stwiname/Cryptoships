pragma solidity ^0.5.0;


import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import './Auction.sol';

contract Game {
  using Address for address payable;
  using SafeMath for uint256;

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

  event HighestBidPlaced(Team team, address bidder, uint amount, uint16[2] move, uint256 endTime);
  event MoveConfirmed(Team team, bool hit, uint16[2] move, address auctionAddress);
  event AuctionCreated(Team team, address auctionAddress);
  event GameCompleted(Team winningTeam);

  mapping(uint => bytes32) fieldHashes;
  uint16 public fieldSize;
  uint public fieldUnits;
  Result public result;
  uint256 public auctionDuration;

  /*
   * Auctions support a max dimension of 2^16
   * So we need to support at least 2^16 * 2 moves
   */
  mapping(uint32 => Auction)[2] auctions;
  uint32[2] auctionsCount;

  address payable owner;

  modifier ownerOnly(){
    require(msg.sender == owner, 'Only the owner can call this');
    _;
  }

  modifier gameRunning() {
    require(result == Result.UNSET, 'Cannot call this funciton once the game is over');
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
    Team startTeam
  ) public {
    require(_fieldSize * _fieldSize > _fieldUnits, "Cannot have more units that spaces available");
    fieldHashes[uint(Team.RED)] = _redFieldHash;
    fieldHashes[uint(Team.BLUE)] = _blueFieldHash;
    fieldSize = _fieldSize;
    fieldUnits = _fieldUnits;
    auctionDuration = _auctionDuration;
    owner = msg.sender;

    createAuction(startTeam, now);
  }

  function placeBid(Team team, uint16[2] memory move) payable public gameRunning {

    // Validate input
    require(
      move[0] < fieldSize && move[1] < fieldSize,
      "Move cannot be outside of playing field"
    );
    require(!hasMoveBeenMade(team, move), "Move has already been made");

    // Get the auction for the right team to bid for
    Auction auction = getCurrentAuction(team);

    // forward value to inner account
    uint256 endTime = auction.placeBid.value(msg.value)(move);

    emit HighestBidPlaced(team, msg.sender, msg.value, move, endTime);
  }

  // Gets called by the oracle when the first bid is made for an auction
  function startAuction(Team team) public ownerOnly gameRunning returns(Auction) {

    // We might be starting the first auction for the team
    if (auctionsCount[uint(team)] > 0) {
      require(
        getCurrentAuction(team).hasEnded(),
        "Cannot start an auction while one is already running"
      );
    }

    Auction otherAuction = getCurrentAuction(otherTeam(team));

    require(
      otherAuction.getEndTime() > 0,
      "First bid must be made on other auction first"
    );

    return createAuction(team, otherAuction.getEndTime() - auctionDuration/2);
  }

  function confirmMove(Team team, bool hit) public ownerOnly {
    Auction auction = getCurrentAuction(team);

    require(auction.hasEnded(), "Auction has not yet ended");

    auction.setResult(hit);

    // Withdraw funds to make it easier when finalising 
    auction.withdrawFunds();

    // This auction has finished but the othe team has none,
    // we can now create it though
    if (auctionsCount[uint(otherTeam(team))] <= 0) {
      startAuction(otherTeam(team));
    }

    Auction otherAuction = getCurrentAuction(otherTeam(team));

    // Auction has ended or has had a bid (has an end time)
    if (otherAuction.hasEnded() || otherAuction.getEndTime() > 0) {
      // Start the next auction
      startAuction(team);
    }

    emit MoveConfirmed(team, hit, auction.getLeadingMove(), address(auction));
  }

  // TODO find better way to encode the field data 
  function finalize(Team winner, bytes32 fieldData, bytes32 salt) public ownerOnly gameRunning {
    require(
      keccak256(abi.encodePacked(fieldData, salt)) == fieldHashes[uint(winner)],
      'Invalid verification of field'
    );

    result = winner == Team.RED ? Result.RED_WINNER : Result.BLUE_WINNER;

    /* Set the current auction as a hit, */
    Auction currentAuction = getCurrentAuction(winner);
    if (currentAuction.hasEnded() && currentAuction.result() == Auction.Result.UNSET)  {
      currentAuction.setResult(true);
    }

    /* Stop current auction of losing team, return funds to latest bidder */
    Auction losingAuction = getCurrentAuction(otherTeam(winner));
    losingAuction.cancel();

    // Calculate total amount of rewards
    uint256 rewardPool = 0;
    for (uint32 i = 0; i < getAuctionsCount(otherTeam(winner)); i++) {
      (, uint256 amount, ) = getAuctionByIndex(otherTeam(winner), i).getLeadingBid();
      rewardPool += amount;
    }

    // Save 10% for owner
    // TODO see if percentage covers oracle costs
    uint256 reward = rewardPool.div(10).mul(9).div(getAuctionsCount(winner));

    /* Return move cost + reward to each player on the winning team */
    for (uint32 i = 0; i < getAuctionsCount(winner); i++) {
      (address payable bidder, uint256 amount, ) = getAuctionByIndex(winner, i).getLeadingBid();

      // Everyone that played gets the same reward for now
      bidder.sendValue(reward.add(amount));
    }

    /* Pay the owner to cover oracle costs */
    owner.sendValue(address(this).balance);

    emit GameCompleted(winner);
  }

  function hasMoveBeenMade(Team team, uint16[2] memory move) public view returns (bool) {
    uint teamId = uint(team);

    for(uint32 i = 0; i < auctionsCount[teamId]; i++) {
      Auction auction = auctions[teamId][i];

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

  function getCurrentAuction(Team team) public view returns(Auction) {
    uint32 count = getAuctionsCount(team);
    require(count > 0, "No auction exists for this team");

    uint teamId = uint(team);

    return auctions[teamId][count - 1];
  }

  function getAuctionsCount(Team team) public view returns(uint32) {
    uint teamId = uint(team);

    return auctionsCount[teamId];
  }

  function getAuctionByIndex(Team team, uint32 index) public view returns(Auction) {
    uint teamId = uint(team);

    return auctions[teamId][index];
  }

  function createAuction(Team team, uint256 startTime) private returns(Auction) {
    uint teamId = uint(team);

    auctionsCount[teamId] ++;
    Auction auction = auctions[teamId][auctionsCount[teamId]-1] = new Auction(startTime, auctionDuration);
    emit AuctionCreated(team, address(auction));
    return auction;
  }

  function otherTeam(Team team) public pure returns(Team) {
    return team == Team.BLUE ? Team.RED : Team.BLUE;
  }

  // Required in order to transfer funds from Auctions
  function() external payable { }
}