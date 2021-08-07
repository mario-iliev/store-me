const path = require('path');

module.exports = (env)=> ({
  entry: path.resolve(__dirname, './src/index.js'),
  watch: !env.production,
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      },
    ]
  },
  resolve: {
    extensions: ['.js']
  },
  output: {
    path: path.resolve(__dirname, './lib'),
    filename: 'index.js',
    libraryTarget: 'umd'
  },
  externals: {
    react: 'umd react'
  }
});
