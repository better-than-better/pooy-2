const http = require('http');

const app = http.createServer((req, res) => {
  if (req.url === '/post' && req.method.toLowerCase() === 'post') {
    const data = [];

    req.on('data', (chunk) => {
      data.push(chunk);
    });

    req.on('end', () => {
      console.log('req body:', Buffer.concat(data).toString());
    })
  }

  res.writeHead(200, {
    'content-type': 'text/html'
  });

  res.end(
    `
    <form action="/post"
method="post" >
  First name: <input type="text" name="fname"><br>
  First name: <input type="text" name="fname"><br>
  Last name: <input type="text" name="lname"><br>
  Last name: <input type="file" name="file"><br>

  <input type="file" name="ffff"><br>
  <input type="submit" value="submit">
</form>
    `
  );
});

app.listen(3009)