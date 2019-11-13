require("ts-node/register");

module.exports = {
  // Uncommenting the defaults below 
  // provides for an easier quick-start with Ganache.
  // You can also follow this format for other networks;
  // see <http://truffleframework.com/docs/advanced/configuration>
  // for more details on how to specify configuration options!
  //
  networks: {
   develop: {
     host: "127.0.0.1",
     port: 8545,
     network_id: "*",
     websockets: true,
   },
    test: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
      websockets: true,
    }
  },
  compilers: {
    solc: {
      version: '0.5.12'
    }
  },
  mocha: {
    reporter: 'eth-gas-reporter',
    reporterOptions : {
      currency: 'nzd'
    }
  },
  test_file_extension_regexp: /.*\.ts$/,
};
