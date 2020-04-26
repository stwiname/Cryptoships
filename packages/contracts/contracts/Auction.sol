pragma solidity ^0.6.0;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import './AuctionListener.sol';
import './AuctionLib.sol';

contract Auction is ReentrancyGuard {
  using AuctionLib for AuctionLib.Data;
  using Address for address payable;

  AuctionLib.Data data;

  address payable owner;

  modifier ownerOnly(){
    require(msg.sender == owner, "Only the owner can call this");
    _;
  }

  constructor(uint256 _startTime, uint256 _duration, AuctionListener _listener) public {
    data.startTime = _startTime;
    data.duration = _duration;
    data.listener = _listener;
    owner = msg.sender;
  }

  function placeBid(uint16[2] memory move) payable public nonReentrant returns(uint256){
    return data.placeBid(move);
  }

  function withdrawFunds() public ownerOnly {
    owner.sendValue(address(this).balance);
  }

  function setResult(bool hit) public ownerOnly {
    data.setResult(hit);
  }

  /* End the auction immediately,
     this is used when the other team wins to stop it instantly,
     return the funds to the leading bidder
   */
  function cancel() public ownerOnly {
    data.cancel();
  }

  function hasStarted() public view returns(bool) {
    return data.hasStarted();
  }

  function hasEnded() public view returns(bool) {
    return data.hasEnded();
  }

  function getLeadingBid() public view returns(address payable bidder, uint amount, uint16[2] memory move) {
    return (data.leadingBid.bidder, data.leadingBid.amount, data.leadingBid.move);
  }

  function getLeadingMove() public view returns(uint16[2] memory move) {
    return data.leadingBid.move;
  }

  function getResult() public view returns(AuctionLib.Result) {
    return data.result;
  }

  /* DEV ONLY*/
  function getBalance() public view returns(uint balance) {
    return address(this).balance;
  }

  function getStartTime() public view returns(uint256) {
    return data.startTime;
  }

  function getEndTime() public view returns(uint256) {
    return data.endTime;
  }

  function getDuration() public view returns(uint256) {
    return data.duration;
  }
}
