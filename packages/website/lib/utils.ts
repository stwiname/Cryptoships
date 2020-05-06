import { utils } from 'ethers';

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

export const hexToRgb = (hex: string, opacity?: number) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  if (!result) {
    return null;
  } 
  const rgb = {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
    a: opacity || 1,
  };

  rgb.toString = function (){
    return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
  }

  return rgb;
}

export function truncateAddress(address: string): string {
  if (!address) {
    return address;
  }
  return `${address.substr(0, 6)}...${address.substr(address.length -4)}`;
}

export const createRadial = (
  color: string,
  innerOpacity: number = 0.8,
  outerOpacity: number = 0.2
) => {
  try {
    const inner = hexToRgb(color, innerOpacity).toString();
    const outer = hexToRgb(color, outerOpacity).toString();

    return `radial-gradient(${inner}, ${outer});`;
  }
  catch(e) {
    return color;
  }
}

export const bnToDate = (num: utils.BigNumber) =>
  !!num && new Date(num.toNumber() * 1000);

export const isBnDateAfterNow = (num: utils.BigNumber) => {
  if (!num) {
    return null;
  }
  return Date.now() < bnToDate(num).getTime();
}
