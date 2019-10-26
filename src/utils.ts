export const numToBase64 = (num: number): string => {
  let s = '';
  let t;

  while (num > 0) {
    t = (num - 1) % 26;
    s = String.fromCharCode(65 + t) + s;
    num = ((num - t) / 26) | 0;
  }
  return s || undefined;
};

export const movesEqual = (a: number[], b: number[]) => {
  return a.length === b.length && a[0] === b[0] && a[1] === b[1];
};

export const moveToString = (x: number, y: number) => {
  return `${numToBase64(x + 1)}${y + 1}`;
};
