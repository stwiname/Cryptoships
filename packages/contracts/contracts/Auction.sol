pragma solidity >=0.4.25 <0.6.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Auction is ReentrancyGuard {

  enum Result {
    UNSET,
    MISS,
    HIT
  }

  struct Bid {
    address payable bidder;
    uint amount;
    uint8[2] move;
  }

  Bid public leadingBid;
  Result public result;
  address payable owner;

  // Start the auction at a later point in time
  uint256 public startTime;
  // How long the auction runs after the first bid
  uint256 public duration;
  // When the auction ends
  uint256 public endTime;


  modifier ownerOnly(){
    require(msg.sender == owner, "Only the owner can call this");
    _;
  }

  constructor(uint256 _startTime, uint256 _duration) public {
    startTime = _startTime;
    duration = _duration;
    owner = msg.sender;
  }

  // TODO should this be owner only? It would break tests
  function placeBid(uint8[2] memory move) payable public nonReentrant returns(uint256){
    // Validate auction
    require(hasStarted(), "Auction has not started");
    require(!hasEnded(), "Auction has ended");
    // Validate input
    require(msg.value > leadingBid.amount, "Bid must be greater than current bid");

    // Transfer the bid back to the previous bidder
    if (leadingBid.bidder != address(0)) {
      leadingBid.bidder.transfer(leadingBid.amount);
    }

    // Transfer the bid to the account
    // owner.send(msg.value);
    leadingBid = Bid(tx.origin, msg.value, move);

    // First bid, auction is started and will end after duration from now
    if (endTime == 0) {
      endTime = now + duration;
    }

    return endTime;
  }

  function withdrawFunds() public ownerOnly {
    owner.transfer(address(this).balance);
  }

  function setResult(bool hit) public ownerOnly {
    require(hasEnded(), "Auction has not yet ended");
    require(result == Result.UNSET, "Auction result already set");
    result = hit ? Result.HIT : Result.MISS;
  }

  /* End the auction immediately,
     this is used when the other team wins to stop it instantly,
     return the funds to the leading bidder
   */
  function cancel() public ownerOnly {
    if (!hasEnded()) {
      endTime = now;
    }

    if (leadingBid.bidder != address(0)) {
      leadingBid.bidder.transfer(leadingBid.amount);

      leadingBid = Bid(address(0), 0, [0, 0]);
    }
  }

  function hasStarted() public view returns(bool) {
    return now >= startTime;
  }

  function hasEnded() public view returns(bool) {
    return endTime != 0 && now > endTime;
  }

  function getLeadingBid() public view returns(address payable bidder, uint amount, uint8[2] memory move) {
    return (leadingBid.bidder, leadingBid.amount, leadingBid.move);
  }

  function getLeadingMove() public view returns(uint8[2] memory move) {
    return leadingBid.move;
  }

  /* DEV ONLY*/
  function getBalance() public view returns(uint balance) {
    return address(this).balance;
  }

  function getEndTime() public view returns(uint256) {
    return endTime;
  }
}