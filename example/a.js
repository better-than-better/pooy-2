const http = require('http');

const app = http.createServer((req, res) => {
  console.log(typeof req.pause);
  res.end('ok');
});

app.listen(4004);