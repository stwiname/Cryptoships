const Auction = artifacts.require("Auction");
const Game = artifacts.require("Game");

module.exports = function(deployer) {
  deployer.deploy(Auction, 0, 1000);
  deployer.deploy(Game, "testRed", 'testBlue', 8, 20, 200000, 0/* Red Team*/);
};
