const index = require('./index.js');

console.log(index);

let tempJson = {
  name:'Hello',
  pass: 'World',
  data: 'moredata'
}

console.log('Starting test functions');
index.saveToS3(tempJson);
console.log('Finished Test Functions');
