"use strict";

const path = require("path");
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const MomentLocalesPlugin = require('moment-locales-webpack-plugin');

module.exports = {
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
      },
      {
          test: /\.svg$/,
          loader: 'svg-url-loader'
      }
    ]
  },

  // File extensions to support resolving
  resolve: {
    extensions: [".ts", ".tsx", ".js"]
  },

  plugins: [
    // new BundleAnalyzerPlugin(),
    new MomentLocalesPlugin(),
  ]
};