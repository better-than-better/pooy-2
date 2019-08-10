const dns = require('dns');
const remoteRequest = require('../modules/remote-request');
const { getIps } = require('../utils');

module.exports = function requested(context) {
  const { proxy, protocol = 'http:', host } = context;

  if (proxy.isPaused) return proxy.pausedRequest.push(context);

  dns.lookup(host, (err, address, family) => {
    if (err) return proxy.emit('error', err);

    const reqOptions = context.request.options;
    const isLocalAddress = ['127.0.0.1', '0.0.0.0', getIps()[`IPv${family}`]].includes(address);

    if (isLocalAddress && reqOptions.port === proxy.port) {
      res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
      res.write('🤡 hello, proxy server', 'utf-8');
      res.end();
      return;
    }

    proxy.direct ? proxy.requestDirect(protocol, req, res) : remoteRequest(context);
  });
}