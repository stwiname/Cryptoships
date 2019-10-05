pragma solidity >=0.4.25 <0.6.0;

library AuctionLib {

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

  struct Data {
    Bid leadingBid;
    Result result;
    // Start the auction at a later point in time
    uint256 startTime;
    // How long the auction runs after the first bid
    uint256 duration;
    // When the auction ends
    uint256 endTime;
  }

  function placeBid(Data storage data, uint8[2] memory move)
    // payable
    public
    returns(uint256)
  {
    // Validate auction
    require(hasStarted(data), "Auction has not started");
    require(!hasEnded(data), "Auction has ended");
    // Validate input
    require(msg.value > data.leadingBid.amount, "Bid must be greater than current bid");

    // Transfer the bid back to the previous bidder
    if (data.leadingBid.bidder != address(0)) {
      data.leadingBid.bidder.transfer(data.leadingBid.amount);
    }

    // Transfer the bid to the account
    // owner.send(msg.value);
    data.leadingBid = Bid(tx.origin, msg.value, move);

    // First bid, auction is started and will end after duration from now
    if (data.endTime == 0) {
      data.endTime = now + data.duration;
    }

    return data.endTime;
  }

  function setResult(Data storage data, bool hit) public {
    require(hasEnded(data), "Auction has not yet ended");
    require(data.result == Result.UNSET, "Auction result already set");
    data.result = hit ? Result.HIT : Result.MISS;
  }

  function hasStarted(Data storage data) public view returns(bool) {
    return now >= data.startTime;
  }

  function hasEnded(Data storage data) public view returns(bool) {
    return data.endTime != 0 && now > data.endTime;
  }
}