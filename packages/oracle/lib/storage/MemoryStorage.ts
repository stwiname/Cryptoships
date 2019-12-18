import { IStorage, ProofData } from './IStorage';

export default class MemoryStorage implements IStorage {

  private data: Record<string, ProofData> = {};

  public async getGame(gameAddress: string): Promise<ProofData> {
    return this.data[gameAddress];
  }

  public async setGame(gameAddress: string, proofData: ProofData): Promise<void> {
    this.data[gameAddress] = proofData;
  }
}