pragma solidity ^0.6.0;

import "truffle/Assert.sol";
import "../contracts/Auction.sol";

contract TestAuction {

  function testAuctionStarted() public {
    Auction auction = new Auction(0, 1000, address(0));

    Assert.equal(auction.hasStarted(), true, "Auction should be started");
  }

  function testAuctionNotStarted() public {
    Auction auction = new Auction(now + 10000, 1000, address(0));

    Assert.equal(auction.hasStarted(), false, "Auction should NOT be started");
  }

  function testAuctionNotEnded() public {
    Auction auction = new Auction(now + 10000, 1000, address(0));

    Assert.equal(auction.hasEnded(), false, "Auction should NOT have ended");
  }
}