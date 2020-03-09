pragma solidity ^0.5.5;

import "@openzeppelin/contracts/utils/Address.sol";
import './AuctionListener.sol';

library AuctionLib {

  using Address for address payable;

  enum Result {
    UNSET,
    MISS,
    HIT
  }

  struct Bid {
    address payable bidder;
    uint amount;
    uint16[2] move;
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

    AuctionListener listener;
  }

  function placeBid(
    Data storage data,
    uint16[2] memory move
  ) public returns(uint256){
    // Validate auction
    require(hasStarted(data), "Auction has not started");
    require(!hasEnded(data), "Auction has ended");

    if (address(data.listener) != address(0)) {
      require(data.listener.isValidMove(move), "Move is not valid");
    }
    // Validate input
    require(msg.value > data.leadingBid.amount, "Bid must be greater than current bid");

    Bid memory previousBid = data.leadingBid;

    data.leadingBid = Bid(tx.origin, msg.value, move);

    // First bid, auction is started and will end after duration from now
    if (data.endTime == 0) {
      data.endTime = now + data.duration;

    }


    // Transfer the bid back to the previous bidder
    if (previousBid.bidder != address(0)) {
      previousBid.bidder.sendValue(previousBid.amount);
    }

    if (address(data.listener) != address(0)) {
      data.listener.bidPlaced(move, msg.value, msg.sender, data.endTime);
    }

    return data.endTime;
  }

  function setResult(Data storage data, bool hit) public {
    require(hasEnded(data), "Auction has not yet ended");
    require(data.result == Result.UNSET, "Auction result already set");
    data.result = hit ? Result.HIT : Result.MISS;
  }

  /* End the auction immediately,
     this is used when the other team wins to stop it instantly,
     return the funds to the leading bidder
   */
  function cancel(Data storage data) public {
    if (!hasEnded(data)) {
      data.endTime = now;
    }

    if (data.leadingBid.bidder != address(0)) {
      data.leadingBid.bidder.sendValue(data.leadingBid.amount);

      data.leadingBid = Bid(address(0), 0, [uint16(0), uint16(0)]);
    }
  }

  function hasStarted(Data storage data) public view returns(bool) {
    return now >= data.startTime;
  }

  function hasEnded(Data storage data) public view returns(bool) {
    return data.endTime != 0 && now > data.endTime;
  }
}