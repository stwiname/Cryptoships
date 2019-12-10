"use strict";

const path = require("path");
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  mode: 'development',
  // Set debugging source maps to be "inline" for
  // simplicity and ease of use
  devtool: "inline-source-map",

  // The application entry point
  entry: ["./lib/index.tsx"],

  // Where to compile the bundle
  // By default the output directory is `dist`
  output: {
    filename: "bundle.js",
    path: path.join(__dirname, 'dist'),
    publicPath: '/dist'
  },

  // Supported file loaders
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        options: {
          configFile: 'tsconfig.json'
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
    'ethers': 'ethers',
  },

  devServer: {
    historyApiFallback: true,
    hot: true,
  },

  plugins: [
    // new BundleAnalyzerPlugin()
  ]
};