pragma solidity >=0.4.25 <0.6.0;

contract Auction {

  struct Bid {
    address payable bidder;
    uint amount;
    uint8[2] move;
  }

  Bid public leadingBid;
  address payable owner;

  // Start the auction at a later point in time
  uint256 public startTime;
  // How long the auction runs after the first bid
  uint256 public duration;
  // When the auction ends
  uint256 public endTime;

  constructor(uint256 _startTime, uint256 _duration) public {
    startTime = _startTime;
    duration = _duration;
    owner = msg.sender;
  }

  function placeBid(uint8[2] memory move) payable public {
    // Validate auction
    require(hasStarted());
    require(!hasEnded());

    // Validate input
    require(msg.value > leadingBid.amount);
    /* TODO validate move
     * Check that move fits within game field
     * Check that move has not already been made
     * This can probably be done in contract that calls auction
     */

    // Transfer the bid back to the previous bidder
    if (leadingBid.bidder != address(0)) {
      leadingBid.bidder.transfer(leadingBid.amount);
    }

    // Transfer the bid to the account
    // owner.send(msg.value);
    leadingBid = Bid(msg.sender, msg.value, move);

    // First bid, auction is started and will 
    if (endTime == 0) {
      endTime = now + duration;
    }

    //TOOD emit event
  }

  function hasStarted() public view returns(bool) {
    return now > startTime;
  }

  function hasEnded() public view returns(bool) {
    return endTime != 0 && now > endTime;
  }

  function getLeadingBid() public view returns(address bidder, uint amount, uint8[2] memory move) {
    return (leadingBid.bidder, leadingBid.amount, leadingBid.move);
  }

  /* DEV ONLY*/
  function getBalance() public view returns(uint balance) {
      return address(this).balance;
  }

  function getEndTime() public view returns(uint256) {
      return endTime;
  }
}
