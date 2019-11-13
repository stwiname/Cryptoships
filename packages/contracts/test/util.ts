
import { filter } from 'ramda';

const advanceTimeAndBlock = async (time) => {
    await advanceTime(time);
    await advanceBlock();

    return Promise.resolve(web3.eth.getBlock('latest'));
}

const advanceTime = (time) => {
    return new Promise((resolve, reject) => {
        (web3.currentProvider as any).send({
            jsonrpc: "2.0",
            method: "evm_increaseTime",
            params: [time],
            id: new Date().getTime()
        }, (err, result) => {
            if (err) { return reject(err); }
            return resolve(result);
        });
    });
}

const advanceBlock = () => {
    return new Promise((resolve, reject) => {
        (web3.currentProvider as any).send({
            jsonrpc: "2.0",
            method: "evm_mine",
            id: new Date().getTime()
        }, async (err, result) => {
            if (err) { return reject(err); }
            const { hash } = await web3.eth.getBlock('latest');

            return resolve(hash);
        });
    });
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

const assertAuctionBid = (bid, expectedBid) => {
    assert.equal(bid.move[0].toNumber(), expectedBid.move[0]);
    assert.equal(bid.move[1].toNumber(), expectedBid.move[1]);
    assert.equal(bid.amount.toNumber(), expectedBid.amount);
    assert.equal(bid.bidder, expectedBid.bidder);
}

export {
    advanceTime,
    advanceBlock,
    advanceTimeAndBlock,
    assertEvent,
    assertAuctionBid,
};