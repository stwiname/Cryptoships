import { Buffer } from 'buffer';
import { utils } from 'ethers';
import { flatten } from 'ramda';
import { BattleField } from './contracts';

// TODO generate ships for any size
export const SHIPS = [5, 4, 3, 3, 2]; // Works for 10x10

export function generateBattlefield(
  size: number = 10,
  ships = SHIPS
): BattleField {
  const field: BattleField = generateEmptyField(size, false);

  const placeShip = (shipSize: number): void => {
    // TODO ensure random is secure
    const horizontal = Math.random() >= 0.5;
    const x = Math.floor(Math.random() * (size - shipSize + 1));
    const y = Math.floor(Math.random() * (size - shipSize + 1));

    if (!checkPlace(horizontal, x, y, shipSize)) {
      // TODO add a basecase, check that ships take up less than some % of map (20%???)
      return placeShip(shipSize);
    }

    return setPlace(horizontal, x, y, shipSize);
  };

  const checkPlace = (
    horizontal: boolean,
    x: number,
    y: number,
    shipSize: number
  ): boolean => {
    for (let i = 0; i < shipSize; i++) {
      if (horizontal) {
        if (field[x + i][y]) {
          return false;
        }
      } else {
        if (field[x][y + i]) {
          return false;
        }
      }
    }
    return true;
  };

  const setPlace = (
    horizontal: boolean,
    x: number,
    y: number,
    shipSize: number
  ) => {
    for (let i = 0; i < shipSize; i++) {
      if (horizontal) {
        field[x + i][y] = true;
      } else {
        field[x][y + i] = true;
      }
    }
  };

  ships.map(placeShip);

  return field;
}

export function generateEmptyField<T = boolean>(
  size: number = 10,
  fillValue?: T
): BattleField<T> {
  const field = new Array(size);
  for (let i = 0; i < size; i++) {
    field[i] = new Array(size).fill(fillValue);
  }

  return field;
}

export function computeFieldHash(field: BattleField, salt?: string): string {
  const x = flatten(field)
    .map(b => Number(b))
    .join('');
  let buffer = Buffer.from(x, 'binary');

  if (salt) {
    buffer = Buffer.concat([buffer, Buffer.from(salt)]);
  }

  return utils.keccak256(buffer);
}

// const hash = computeFieldHash(generateBattlefield(), new Date().toString());
// console.log('HASH', hash);

// const bf = generateBattlefield();
// console.log(bf);

// bf.map(row => console.log(row.map(x => x ? 'x' : 'o')));
