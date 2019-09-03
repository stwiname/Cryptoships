module.exports = {
  // Uncommenting the defaults below 
  // provides for an easier quick-start with Ganache.
  // You can also follow this format for other networks;
  // see <http://truffleframework.com/docs/advanced/configuration>
  // for more details on how to specify configuration options!
  //
  // networks: {
  //  development: {
  //    host: "127.0.0.1",
  //    port: 9545,
  //    network_id: "*",
  //    websockets: true,
  //  },
  // test: {
  //   host: "127.0.0.1",
  //   port: 7545,
  //   network_id: "*"
  // }
  // }
  mocha: {
    reporter: 'eth-gas-reporter',
    reporterOptions : {
      currency: 'nzd'
    }
  }
};
