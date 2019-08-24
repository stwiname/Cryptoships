pragma solidity >=0.4.25 <0.6.0;

import './Auction.sol';

contract Game {

  enum Team {RED,BLUE}

  string public fieldProof;
  uint public fieldSize;
  uint public fieldUnits;
  uint256 public auctionDuration;

  mapping(uint => Auction) redAuctions;
  uint redAuctionCount;

  mapping(uint => Auction) blueAuctions;
  uint blueAuctionCount;


  constructor(string memory _fieldProof, uint _fieldSize,  uint _fieldUnits, uint256 _auctionDuration) public {
    require(_fieldSize * _fieldSize > _fieldUnits);
    fieldProof = _fieldProof;
    fieldSize = _fieldSize;
    fieldUnits = _fieldUnits;
    auctionDuration = _auctionDuration;

    // TODO start auction for a team
  }

  // TODO make only the auction contract pay?
  function placeBid(Team team, uint8[2] memory move) payable public {

    // Validate input
    require(move[0] < fieldSize);
    require(move[1] < fieldSize);
      // Fits within field size
      // Hasnt been made before

    // Place bid on correct auction
    Auction auction = team == Team.BLUE
      ? blueAuctions[blueAuctionCount - 1]
      : redAuctions[redAuctionCount -1];


    // forward value to inner account
    auction.placeBid.value(msg.value)(move);

  }


  // Only contract initiator
  function finalize() public {
    // Reveal field to match proof

    // Pay out 
  }
}