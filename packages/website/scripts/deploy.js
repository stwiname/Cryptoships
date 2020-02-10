#!/usr/bin/env node
const pinataSDK = require('@pinata/sdk');
const path = require('path');

const PINATA_KEY = process.env.PINATA_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;

if (!PINATA_KEY) {
  console.error('PINATA_KEY not provided');
  process.exit(1);
}

if (!PINATA_SECRET_KEY) {
  console.error('PINATA_SECRET_KEY not provided');
  process.exit(1);
}

const pinata = pinataSDK(PINATA_KEY, PINATA_SECRET_KEY);

const uploadPath = path.resolve(`${__dirname}/../dist`);

async function uploadToIPFS() {
  await pinata.testAuthentication();

  console.log(`Uploading ${uploadPath} to IPFS`);

  const { IpfsHash } = await pinata.pinFromFS(
    uploadPath,
    {
      pinataMetadata: {
        name: 'Cryptoships Website',
      }
    }
  );

  console.log('Upload to IPFS complete', IpfsHash);

  return IpfsHash;
}

uploadToIPFS()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });