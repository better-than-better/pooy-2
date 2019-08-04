const fakeServer = require('./fake-server');
const connectRemote = require('./remote-connect');

function connectHandler(proxy, req, socket, head) {
  const requestOptions = {
    host: req.url.split(':')[0],
    port: req.url.split(':')[1] || 443
  };

  if (proxy.direct) {
    connectRemote(requestOptions, socket);
  } else {
    fakeServer(proxy, requestOptions.host, (port) => {
      requestOptions.port = port;
      requestOptions.host = '127.0.0.1';
      connectRemote(requestOptions, socket);
    });
  }
}

module.exports = connectHandler;
