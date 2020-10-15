const path = require('path');
const slsw = require('serverless-webpack');

console.log('Webpack config is in', __dirname);
console.log('slsw found Entries: ', slsw.lib.entries);

module.exports = {
  mode: 'production',
  entry: slsw.lib.entries,
  target: 'node',
  output: {
    libraryTarget: 'commonjs2',
    path: path.resolve(__dirname, '.webpack'),
    filename: '[name].js'
  },
  optimization: {
    minimize: true
  },
  resolve: {
    extensions: ['.js']
  },
  module: {
    rules: [
      {
        test: /\.js/,
        loader: 'babel-loader',
        include: path.resolve(__dirname, 'src'),
      }
    ]
  }
};
