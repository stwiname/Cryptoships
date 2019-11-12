# `Oracle`

The oracle is a node service that generates games and keeps the layout of the battle fields secret. It confirms whether a move was a hit or a miss, and confims the winning team.

## Usage

```
Options:
  --help          Show help                                            [boolean]
  --version       Show version number                                  [boolean]
  --secretKey     secretKey for the account used to deploy the game
                                                             [string] [required]
  --gameAddress   a contract address to an existing game                [string]
  --web3Endpoint  endpoint for web3 gateway (overwrites network usage)  [string]
  --network       ethers.js network names                 [default: "homestead"]
  --fieldSize     fieldSize to be used for new games               [default: 10]
```
