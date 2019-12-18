import { IStorage, ProofData } from './IStorage';
import * as path from 'path';
import * as fs from 'fs';

export default class FileStorage implements IStorage {

  constructor(private directory: string) {
    if (!fs.existsSync(directory)) {
      throw new Error('FileStorage: directory doesnt exist');
    }
  }

  private getFilePath(gameAddress: string): string {
    const file = path.join(this.directory, `${gameAddress}.json`); // TODO save in directory
    return file;
  }

  public async getGame(gameAddress: string): Promise<ProofData> {

    const proofString = await new Promise<string>((resolve, reject) => {
      fs.readFile(this.getFilePath(gameAddress), (err, data) => {
        if (err) {
          reject(err);
        }
        resolve(data.toString('utf8'));
      })
    });

    return JSON.parse(proofString);
  }

  public async setGame(gameAddress: string, proofData: ProofData): Promise<void> {
    const proofString = JSON.stringify(proofData, null, 2);

    await new Promise((resolve, reject) => {
      fs.writeFile(this.getFilePath(gameAddress), proofString, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  }
}