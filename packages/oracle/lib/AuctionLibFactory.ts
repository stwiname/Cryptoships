/* For some reason typechain doesn't output any files so we just reimplement*/

import { Contract, ContractFactory, Signer } from "ethers";
import { Provider } from "ethers/providers";
import { UnsignedTransaction } from "ethers/utils/transaction";

const { abi, bytecode } = require('contracts/build/contracts/AuctionLib.json');

export default class AuctionLibFactory extends ContractFactory {
  constructor(signer?: Signer) {
    super(abi, bytecode, signer);
  }

  deploy(): Promise<Contract> {
    return super.deploy() as Promise<Contract>;
  }
  getDeployTransaction(): UnsignedTransaction {
    return super.getDeployTransaction();
  }
  attach(address: string): Contract {
    return super.attach(address);
  }
  connect(signer: Signer): AuctionLibFactory {
    return super.connect(signer) as AuctionLibFactory;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): Contract {
    return new Contract(address, abi, signerOrProvider);
  }
}