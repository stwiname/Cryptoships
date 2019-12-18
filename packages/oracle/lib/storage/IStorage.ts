import { Team, BattleField } from '../contracts';

export type ProofData = Record<Team, { field: BattleField, salt: string }>;

export interface IStorage {

  setGame(
    gameAddress: string,
    proofData: ProofData,
  ): Promise<void>;

  getGame(gameAddress: string): Promise<ProofData>;
}