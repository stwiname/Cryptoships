const Auction = artifacts.require("Auction");
const AuctionLib = artifacts.require("AuctionLib");
const Game = artifacts.require("Game");

module.exports = async function(deployer) {
  deployer.deploy(AuctionLib);
  deployer.link(AuctionLib, [Auction, Game]);
  deployer.deploy(Auction, 0, 1000);
  deployer.deploy(Game, "test", 8, 20, 200000, 0/* Red Team*/);
};
