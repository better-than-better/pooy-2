const https = require('https');
const tls = require('tls');
const { requestHandler } = require('./helper');
const createFromRootCA = require('../ca-helper/create-from-root-ca');

let ok = false;
let port = 0;

module.exports = function fakeServer(proxy, domain, cb) {
  if (port) return cb(port);

  const selfSignCert = !ok && createFromRootCA(domain, 1024);

  ok = true;

  const SNICallback = function (servername, callback) {
    const selfSignCert = createFromRootCA(servername, 1024);

    callback(null, tls.createSecureContext({
      key: selfSignCert.privateKey,
      cert: selfSignCert.certificate
    }));
  };

  const ssllOptions = {
    key: selfSignCert.privateKey,
    cert: selfSignCert.certificate,
    secureProtocol: 'SSLv23_method',
    honorCipherOrder: true,
    SNICallback
  };

  const server = https.createServer(ssllOptions);

  server.on('request', requestHandler.bind(null, proxy, 'https:'));

  server.listen(port, () => {
    port = server.address().port
    cb(port);
  });
};
