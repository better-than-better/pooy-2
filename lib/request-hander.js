const dns = require('dns');
const Context = require('./context');
const remoteRequest = require('./remote-request');
const { getIps } = require('./utils');

/**
 * request handler
 * @param {Proxy} proxy 
 * @param {original node req} req 
 * @param {original node res} res 
 */
function requestHandler(proxy, protocol = 'http:', req, res) {
  const _context = new Context(protocol, req, res, proxy);

  proxy.emit('request', _context);
  dns.lookup(req.headers.host.split(':')[0], (err, address, family) => {
    if (err) return proxy.emit('error', err);

    const reqOptions = _context.request.options;
    const isLocalAddress = ['127.0.0.1', '0.0.0.0', getIps()[`IPv${family}`]].includes(address);

    if (isLocalAddress && reqOptions.port === proxy.port) {
      res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
      res.write('🤡 hello, proxy server', 'utf-8');
      res.end();
      return;
    }

    proxy.direct ? proxy.requestDirect(protocol, req, res) : remoteRequest(_context);
  });
}

module.exports = requestHandler;
