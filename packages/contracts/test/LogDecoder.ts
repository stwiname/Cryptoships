//https://github.com/trufflesuite/truffle/issues/555#issuecomment-415170624

import { utils } from 'ethers';

export default class LogDecoder {
  private _methodIDs: Record<string, utils.EventDescription[]>;

  constructor(abis: any[] = []) {
    this._methodIDs = {}
    abis.forEach(abi => {
      const methodInterface = new utils.Interface(abi);
      Object.keys(methodInterface.events).forEach(evtKey => {
        const evt = methodInterface.events[evtKey];
        const signature = evt.topic;
        // Handles different indexed arguments with same signature from different contracts 
        // Like ERC721/ERC20 Transfer
        this._methodIDs[signature] = this._methodIDs[signature] || []
        this._methodIDs[signature].push(evt);
      })
    })
  }

  decodeLogs(logs: any) {
    return logs.map(log => {
      const evts = this._methodIDs[log.topics[0]];
      for (let index = 0; index < evts.length; index++) {
        const evt = evts[index];
        try {
          return {
            address: log.address.toLowerCase(),
            event: evt.name,
            signature: evt.signature,
            args: evt.decode(log.data, log.topics)
          }
        } catch (e) {
          console.error('Log parse failed', e);
        }
      }

      throw new Error("Log doesn't match");
    })
  }
}
