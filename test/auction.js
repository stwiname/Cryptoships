const Auction = artifacts.require('Auction');
const BN = require('bn.js');
const { advanceTimeAndBlock } = require('./util');

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
    assert.equal(leadingBid.move[0].toNumber(), 0);
    assert.equal(leadingBid.move[1].toNumber(), 0);
    assert.equal(leadingBid.amount.toNumber(), 1);
    assert.equal(leadingBid.bidder, accounts[0]);

    const gas = await getGasInfo(receipt);
    const finalBalance = await getBalance(0);
    assert.equal(finalBalance.toString(), initBalance.sub(gas.used.mul(gas.price)).sub(new BN(1)).toString());
  });

  it('should be able to outbid an existing bid', async () => {
    await instance.placeBid([0, 0], { from: accounts[0], value: 1 });
    const receipt = await instance.placeBid([1, 1], { from: accounts[1], value: 2 });

    const leadingBid = await instance.getLeadingBid();
    assert.equal(leadingBid.move[0].toNumber(), 1);
    assert.equal(leadingBid.move[1].toNumber(), 1);
    assert.equal(leadingBid.amount.toNumber(), 2);
    assert.equal(leadingBid.bidder, accounts[1]);
  });

  it('should be able to outbid an existing bid', async () => {
    await instance.placeBid([0, 0], { from: accounts[0], value: 2 });
    await instance.placeBid([1, 1], { from: accounts[1], value: 1 })
      .catch(e => expect(e).to.not.be.null);

    const leadingBid = await instance.getLeadingBid();
    assert.equal(leadingBid.move[0].toNumber(), 0);
    assert.equal(leadingBid.move[1].toNumber(), 0);
    assert.equal(leadingBid.amount.toNumber(), 2);
    assert.equal(leadingBid.bidder, accounts[0]);
  });

  it('should be reject a matching bid', async () => {
    await instance.placeBid([0, 0], { from: accounts[0], value: 1 });
    await instance.placeBid([1, 1], { from: accounts[1], value: 1 })
      .catch(e => expect(e).to.not.be.null);

    const leadingBid = await instance.getLeadingBid();
    assert.equal(leadingBid.move[0].toNumber(), 0);
    assert.equal(leadingBid.move[1].toNumber(), 0);
    assert.equal(leadingBid.amount.toNumber(), 1);
    assert.equal(leadingBid.bidder, accounts[0]);
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

  it('should be able to check when the auction has ended', async () => {
    // Start the auction
    await instance.placeBid([0, 0], { from: accounts[0], value: 1 });

    await advanceTimeAndBlock(DURATION * 2);

    await instance.placeBid([0, 0], { from: accounts[1], value: 2 })
      .catch(e => expect(e).to.not.be.null);
  });
});
