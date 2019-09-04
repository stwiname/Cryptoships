pragma solidity >=0.4.25 <0.6.0;

import './Auction.sol';

contract Game {

  event HighestBidPlaced(Team team, address bidder, uint amount, uint8[2] move, uint256 endTime);

  enum Team {
    RED,
    BLUE
  }

  string public fieldProof;
  uint public fieldSize;
  uint public fieldUnits;
  uint256 public auctionDuration;

  mapping(uint => Auction)[2] auctions;
  uint[2] auctionsCount;

  address owner;

  modifier ownerOnly(){
    require(msg.sender == owner);
    _;
  }

  constructor(
    string memory _fieldProof,
    uint _fieldSize,
    uint _fieldUnits,
    uint256 _auctionDuration,
    Team startTeam
  ) public {
    require(_fieldSize * _fieldSize > _fieldUnits);
    fieldProof = _fieldProof;
    fieldSize = _fieldSize;
    fieldUnits = _fieldUnits;
    auctionDuration = _auctionDuration;
    owner = msg.sender;

    createAuction(startTeam, now);
  }

  function placeBid(Team team, uint8[2] memory move) payable public {

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
  function startAuction(Team team) public ownerOnly {

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

    createAuction(team, otherAuction.getEndTime() - auctionDuration/2);
  }

  function confirmMove(Team team, bool hit) public ownerOnly {
    Auction auction = getCurrentAuction(team);

    require(auction.hasEnded(), "Auction has not yet ended");

    auction.setResult(hit);

    // Withdraw funds to make it easier when finalising 
    // TODO fix
    // auction.withdrawFunds();

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
  }

  // Only contract initiator
  function finalize(Team winner) public ownerOnly {
    // Reveal field to match proof


    // Deal with a potential running of losing teams auction
    // Pay out 
  }

  function hasMoveBeenMade(Team team, uint8[2] memory move) public view returns (bool) {
    uint teamId = uint(team);

    for(uint i = 0; i < auctionsCount[teamId]; i++) {
      Auction auction = auctions[teamId][i];

      // Move isnt considered made if the auction has not ended
      if (!auction.hasEnded()) {
        continue;
      }

      (address bidder, uint amount, uint8[2] memory leadingMove) = auction.getLeadingBid();

      if (bidder != address(0) && leadingMove[0] == move[0] && leadingMove[1] == move[1]) {
        return true;
      }
    }

    return false;
  }

  function getCurrentAuction(Team team) public view returns(Auction) {
    uint teamId = uint(team);

    require(auctionsCount[teamId] > 0, "No auction exists for this team");

    return auctions[teamId][auctionsCount[teamId] - 1];
  }

  function createAuction(Team team, uint256 startTime) private {
    uint teamId = uint(team);

    auctions[teamId][auctionsCount[teamId]] = new Auction(startTime, auctionDuration);
    auctionsCount[teamId] ++;
  }

  function otherTeam(Team team) public pure returns(Team) {
    return team == Team.BLUE ? Team.RED : Team.BLUE;
  }
}