pragma solidity ^0.5.5;

interface AuctionListener {
  function bidPlaced(uint16[2] calldata move, uint amount, address sender, uint256 endTime) external;
  function isValidMove(uint16[2] calldata move) external view returns(bool);
}