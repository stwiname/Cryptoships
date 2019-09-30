"use strict";

const path = require("path");

module.exports = {
  mode: 'development',
  // Set debugging source maps to be "inline" for
  // simplicity and ease of use
  devtool: "inline-source-map",

  // The application entry point
  entry: "./src/index.tsx",

  // Where to compile the bundle
  // By default the output directory is `dist`
  output: {
    filename: "bundle.js",
    publicPath: '/'
  },

  // Supported file loaders
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        options: {
          configFile: 'tsconfig-web.json'
        }
      }
    ]
  },

  // File extensions to support resolving
  resolve: {
    extensions: [".ts", ".tsx", ".js"]
  },

  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
    'ethers': 'ethers',
  },

  devServer: {
    historyApiFallback: true,
  }
};