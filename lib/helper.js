const net = require('net');
const requested = require('./requested');
const Context = require('./context');
const fakeServer = require('./fake-server');

function remoteConnect(requestOptions, socket) {
  const tunnel = net.createConnection(requestOptions, function() {
    const headers = {
      'connection': 'keep-alive',
      'proxy-agent': 'pooy'
    };

    const onerror = function(error) {
      if (error) {
        tunnel.end();
        socket.end();
        return;
      }

      tunnel.pipe(socket);
      socket.pipe(tunnel);
    };

    synReply(socket, 200, 'connection established', headers, onerror);
  });

  tunnel.setNoDelay(true);
  tunnel.on('error', onTargetError);

  function onTargetError(e) {
    synReply(socket, 502, "Tunnel Error", {}, function() {
      try {
        socket.end();
      } catch (e) {
        console.log(e)
      }
    });
  }
};

function synReply(socket, code, reason, headers, cb) {
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
* request 处理
* @param {Proxy} proxy 
* @param {original node req} req 
* @param {original node res} res 
*/
function requestHandler(proxy, protocol = 'http:', req, res) {
  const _context = new Context(protocol, req, res, proxy);

  proxy.emit('_useRequestRules', _context);
  proxy.emit('request', _context);
  !_context.hasReadBody && requested(_context);
};

/**
 * connect 处理转发 https 流量
 */
exports.connectHandler = function(proxy) {
  fakeServer.on('request', requestHandler.bind(null, proxy, 'https:'));
  fakeServer.listen(0);

  const port = fakeServer.address().port;

  return function connectHandler(req, socket) {
    const requestOptions = {
      host: req.url.split(':')[0],
      port: req.url.split(':')[1] || 443
    };

    if (!proxy.direct) {
      requestOptions.port = port;
      requestOptions.host = '127.0.0.1';
    }

    remoteConnect(requestOptions, socket);
  }
};

exports.requestHandler = requestHandler;
