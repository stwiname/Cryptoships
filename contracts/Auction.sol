pragma solidity >=0.4.25 <0.6.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import './AuctionLib.sol';

contract Auction is ReentrancyGuard {
  using AuctionLib for AuctionLib.Data;

  AuctionLib.Data data;

  address payable owner;

  modifier ownerOnly(){
    require(msg.sender == owner, "Only the owner can call this");
    _;
  }

  constructor(uint256 _startTime, uint256 _duration) public {
    data.startTime = _startTime;
    data.duration = _duration;
    owner = msg.sender;
  }

  // TODO should this be owner only?
  function placeBid(uint8[2] memory move) payable public nonReentrant returns(uint256){
    return data.placeBid(move);
  }

  function withdrawFunds() public ownerOnly {
    owner.transfer(address(this).balance);
  }

  function setResult(bool hit) public ownerOnly {
    data.setResult(hit);
  }

  function hasStarted() public view returns(bool) {
    return data.hasStarted();
  }

  function hasEnded() public view returns(bool) {
    return data.hasEnded();
  }

  function getLeadingBid() public view returns(address bidder, uint amount, uint8[2] memory move) {
    return (data.leadingBid.bidder, data.leadingBid.amount, data.leadingBid.move);
  }

  function getLeadingMove() public view returns(uint8[2] memory move) {
    return data.leadingBid.move;
  }

  function getEndTime() public view returns(uint256) {
    return data.endTime;
  }

  function getStartTime() public view returns(uint256) {
    return data.startTime;
  }

  function getResult() public view returns(AuctionLib.Result) {
    return data.result;
  }

  /* DEV ONLY*/
  function getBalance() public view returns(uint balance) {
      return address(this).balance;
  }
}
