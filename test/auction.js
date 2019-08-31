const Auction = artifacts.require('Auction');
const BN = require('bn.js');
const { advanceTimeAndBlock, assertAuctionBid } = require('./util');

const result = {
  unset: 0,
  miss: 1,
  hit: 2,
};

const DURATION = 1000;

contract('Auction', accounts => {
  let instance = null;

  beforeEach(async () => {
    instance = await Auction.new(0, DURATION, { from: accounts[0] });
  });

  async function getGasInfo(receipt) {
    return {
      used: new BN(receipt.receipt.gasUsed),
      price: new BN((await web3.eth.getTransaction(receipt.tx)).gasPrice)
    }
  }

  async function getBalance(index) {
    return new BN(await web3.eth.getBalance(accounts[index]));
  }

  it('should be able to place a bid, and have the balance change', async () => {
    assert.equal(await instance.hasStarted(), true);
    assert.equal(await instance.hasEnded(), false);

    const initBalance = await getBalance(0);
    const receipt = await instance.placeBid([0, 0], { from: accounts[0], value: 1 });

    const leadingBid = await instance.getLeadingBid();

    assertAuctionBid(leadingBid, { move: [0, 0], amount: 1, bidder: accounts[0] });

    const gas = await getGasInfo(receipt);
    const finalBalance = await getBalance(0);
    assert.equal(finalBalance.toString(), initBalance.sub(gas.used.mul(gas.price)).sub(new BN(1)).toString());
  });

  it('should be able to outbid an existing bid', async () => {
    await instance.placeBid([0, 0], { from: accounts[0], value: 1 });
    const receipt = await instance.placeBid([1, 1], { from: accounts[1], value: 2 });

    const leadingBid = await instance.getLeadingBid();
    assertAuctionBid(leadingBid, { move: [1, 1], amount: 2, bidder: accounts[1] });
  });

  it('should be able to outbid an existing bid', async () => {
    await instance.placeBid([0, 0], { from: accounts[0], value: 2 });
    await instance.placeBid([1, 1], { from: accounts[1], value: 1 })
      .catch(e => expect(e).to.not.be.null);

    const leadingBid = await instance.getLeadingBid();
    assertAuctionBid(leadingBid, { move: [0, 0], amount: 2, bidder: accounts[0] });
  });

  it('should be reject a matching bid', async () => {
    await instance.placeBid([0, 0], { from: accounts[0], value: 1 });
    await instance.placeBid([1, 1], { from: accounts[1], value: 1 })
      .catch(e => expect(e).to.not.be.null);

    const leadingBid = await instance.getLeadingBid();
    assertAuctionBid(leadingBid, { move: [0, 0], amount: 1, bidder: accounts[0] });
  });

  it('should be able bid overwrite a bid and return the previous bid balance', async () => {
    const initBalance = await getBalance(0);
    const receipt = await instance.placeBid([0, 0], { from: accounts[0], value: 1 });

    const receipt2 = await instance.placeBid([0, 0], { from: accounts[1], value: 2 });

    const gas = await getGasInfo(receipt);
    const finalBalance = await getBalance(0);
    assert.equal(finalBalance.toString(), initBalance.sub(gas.used.mul(gas.price)).toString());
  });

  it('should be able to check when the auction has ended', async () => {
    // Start the auction
    await instance.placeBid([0, 0], { from: accounts[0], value: 1 });

    await advanceTimeAndBlock(DURATION * 2);

    assert.equal(await instance.hasEnded(), true);
  });

  it('should not be able to bid after the auction has ended', async () => {
    // Start the auction
    await instance.placeBid([0, 0], { from: accounts[0], value: 1 });

    await advanceTimeAndBlock(DURATION * 2);

    await instance.placeBid([0, 0], { from: accounts[1], value: 2 })
      .catch(e => expect(e).to.not.be.null);
  });

  it('should not allow the owner to set the result before it has ended', async () => {
    // Start the auction
    await instance.placeBid([0, 0], { from: accounts[1], value: 1 });

    await instance.setResult(result.hit, { from: accounts[0] })
      .catch(e => expect(e).to.not.be.null);
  });

  it('should allow the owner to set the result once it has ended', async () => {
    // Start the auction
    await instance.placeBid([0, 0], { from: accounts[1], value: 1 });

    await advanceTimeAndBlock(DURATION * 2);

    await instance.setResult(result.hit, { from: accounts[0] });
  });

  it('should allow the owner to only set the result once', async () => {
    // Start the auction
    await instance.placeBid([0, 0], { from: accounts[1], value: 1 });

    await advanceTimeAndBlock(DURATION * 2);

    await instance.setResult(result.miss, { from: accounts[0] });
    await instance.setResult(result.hit, { from: accounts[0] })
      .catch(e => expect(e).to.not.be.null);
  });
});
