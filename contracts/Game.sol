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

  constructor(string memory _fieldProof, uint _fieldSize,  uint _fieldUnits, uint256 _auctionDuration) public {
    require(_fieldSize * _fieldSize > _fieldUnits);
    fieldProof = _fieldProof;
    fieldSize = _fieldSize;
    fieldUnits = _fieldUnits;
    auctionDuration = _auctionDuration;
    owner = msg.sender;

  }

  // TODO make only the auction contract pay?
  function placeBid(Team team, uint8[2] memory move) payable public {

    // Validate input
    require(move[0] < fieldSize, "Move cannot be outside of playing field");
    require(move[1] < fieldSize, "Move cannot be outside of playing field");
    require(!hasMoveBeenMade(team, move), "Move has already been made");

    uint teamId = uint(team);

    // The first bidder gets to chose what team goes first
    if (auctionsCount[teamId] == 0) {
      createAuction(team, now);

      Team otherTeam = otherTeam(team);
      createAuction(otherTeam, now + auctionDuration /2);
    }

    // Get the auction for the right team to bid for
    Auction auction = getCurrentAuction(team);

    // forward value to inner account
    uint256 endTime = auction.placeBid.value(msg.value)(move);

    emit HighestBidPlaced(team, msg.sender, msg.value, move, endTime);
  }

  function confirmMove(Team team, bool hit) public ownerOnly {
    Auction auction = getCurrentAuction(team);

    require(auction.hasEnded());

    auction.setResult(hit);

    Auction otherAuction = getCurrentAuction(otherTeam(team));
    // Start the next auction for the team
    // TODO does it need to wait for the other team auction to start?
    createAuction(team, now);
  }

  // Only contract initiator
  function finalize() public ownerOnly {
    // Reveal field to match proof

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