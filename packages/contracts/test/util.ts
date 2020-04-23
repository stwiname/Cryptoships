import BN from 'bn.js';
import { utils } from 'ethers';
import { filter } from 'ramda';

const nullAddress = '0x0000000000000000000000000000000000000000';

const advanceTimeAndBlock = async (time) => {
    await advanceTime(time);
    await advanceBlock();

    return Promise.resolve(web3.eth.getBlock('latest'));
}
const sendEvmRPC = (method: string, params: Array<any>) => {
  return new Promise((resolve, reject) => {
    (web3.currentProvider).send({
        jsonrpc: "2.0",
        method,
        params,
        id: new Date().getTime()
    }, (err, result) => {
        if (err) { return reject(err); }
        if (result.error) { return reject(result.error); }
        return resolve(result);
    });
  });
}

const advanceTime = (time) => {
  return sendEvmRPC('evm_increaseTime', [time]);
}

const advanceBlock = async () => {
  await sendEvmRPC('evm_mine');
  const { hash } = await web3.eth.getBlock('latest');
  return hash;
}

const snapshotEvm = () => {
  return sendEvmRPC('evm_snapshot').then((r) => r.result);
}

const revertEvm = (snapshotId) => {
  return sendEvmRPC('evm_revert', [snapshotId]);
}

const assertEvent = (contract, filter) => {
    return new Promise((resolve, reject) => {
        let event = contract[filter.event]((error, event) => {
            console.log('YOYO');
            if (error) {
                return reject(error);
            }
            resolve(event.returnValues);
        });

        console.log("EVENT", event.unsubscribe);

        // console.log('Yo', Object.keys(event));
        // event.watch();
        // event.get((error, logs) => {
        //     var log = filter(filter, log);
        //     if (log) {
        //         resolve(log);
        //     } else {
        //         throw Error("Failed to find filtered event for " + filter.event);
        //     }
        // });
        // event.stopWatching();
    });
}

const bnMoveToNumber = (move: [utils.BigNumber, utils.BigNumber] | [number, number ]): [number, number] => {
    if (typeof move[0] === 'number' || typeof move[1] === 'number') {
        return move as [number, number];
    }

    return [
        move[0].toNumber(),
        move[1].toNumber(),
    ]
}

const assertAuctionBid = (bid, expectedBid) => {
    const move = bnMoveToNumber(bid.move);
    assert.equal(move[0], expectedBid.move[0]);
    assert.equal(move[1], expectedBid.move[1]);
    assert.equal(bid.amount.toString(), expectedBid.amount.toString());
    assert.equal(bid.bidder, expectedBid.bidder);
}

const getGasInfo = async (receipt: any) => {
    return {
        used: new utils.BigNumber(receipt.receipt.gasUsed),
        price: new utils.BigNumber((await web3.eth.getTransaction(receipt.tx)).gasPrice),
    };
}

export {
    advanceTime,
    advanceBlock,
    advanceTimeAndBlock,
    assertEvent,
    assertAuctionBid,
    getGasInfo,
    nullAddress,
};