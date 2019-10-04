const fs = require('fs');

const reader = fs.createReadStream(`${__dirname}/bigfile`);

console.log('start:', Date.now(), '\n');

function foo(field) {
  reader.on('data', (chunk) => console.log(field, 'read data', chunk.length));
  // reader.on('data', () => console.log(field, '....read data'));
}

reader.on('unpipe', () => {
  console.log('closeed', Date.now());
})

foo('0')

setTimeout(() => {
  foo('1')
  foo('2')
}, 2);