const fs = require('fs');
const dns = require('dns');
const remoteRequest = require('../modules/remote-request');
const { getIps } = require('../utils');
const pooyDir = `${process.env.HOME}/.pooy`;

module.exports = function requested(context) {
  const { proxy, protocol = 'http:', hostname, clientRequest, res } = context;

  if (proxy.isPaused) return proxy.pausedRequest.push(context);

  dns.lookup(hostname, (err, address, family) => {
    if (err) return proxy.emit('error', err, context);

    const reqOptions = context.request.options;
    const isLocalAddress = ['127.0.0.1', '0.0.0.0', getIps()[`IPv${family}`]].includes(address);

    if (isLocalAddress && reqOptions.port === proxy.port) {
      if (reqOptions.path === '/ssl') {
        res.setHeader('content-type', 'application/octet-stream');
        res.setHeader('content-disposition', `attachment; filename=POOY_rootCA.crt`);
        fs.createReadStream(pooyDir + '/POOY_rootCA.crt').pipe(res);
      } else {
        res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
        res.write('🤡 hello, proxy server', 'utf-8');
        res.end();
      }

      return;
    }

    proxy.direct ? proxy.requestDirect(protocol, clientRequest, res) : remoteRequest(context);
  });
}