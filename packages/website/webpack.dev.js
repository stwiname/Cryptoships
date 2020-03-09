const merge = require('webpack-merge');
const common = require('./webpack.common.js');
module.exports = merge(common, {
  mode: 'development',
  // Set debugging source maps to be "inline" for
  // simplicity and ease of use
  devtool: "inline-source-map",

  devServer: {
    historyApiFallback: true,
    hot: true,
  },
});