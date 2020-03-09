const merge = require('webpack-merge');
const common = require('./webpack.common.js');
module.exports = merge(common, {
  mode: 'production',

  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
    'ethers': 'ethers',
  },
});