const Context = require('./context');
const requested = require('./requested');
const fakeServer = require('./fake-server');
const remoteConnect = require('./remote-connect');

exports.synReply = function synReply(socket, code, reason, headers, cb) {
  try {
    const statusLine = `HTTP/1.1 ${code} ${reason}\r\n`;

    let headerLines = '';

    for (let key in headers) {
      headerLines += `${key}: ${headers[key]}\r\n`;
    }

    socket.write(`${statusLine}${headerLines}\r\n`, 'utf-8', cb);
  } catch (error) {
    cb(error);
  }
};

/**
* request handler
* @param {Proxy} proxy 
* @param {original node req} req 
* @param {original node res} res 
*/
exports.requestHandler = function requestHandler(proxy, protocol = 'http:', req, res) {
  const _context = new Context(protocol, req, res, proxy);

  proxy.emit('_useRequestRules', _context);
  proxy.emit('request', _context);
  !_context.hasReadBody && requested(_context);
};


exports.connectHandler = function connectHandler(proxy, req, socket, head) {
  const requestOptions = {
    host: req.url.split(':')[0],
    port: req.url.split(':')[1] || 443
  };

  if (proxy.direct) {
    remoteConnect(requestOptions, socket);
  } else {
    fakeServer(proxy, requestOptions.host, (port) => {
      requestOptions.port = port;
      requestOptions.host = '127.0.0.1';
      remoteConnect(requestOptions, socket);
    });
  }
}

