const nodemon = require('nodemon')

require('dotenv').config()

nodemon({
  script: 'src/index.js',
  exec: 'babel-node',
  ext: 'js json'
});
