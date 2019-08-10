const https = require('https');
const tls = require('tls');
const createFromRootCA = require('../../ca-helper/create-from-root-ca');

const SNICallback = function (servername, callback) {
  const selfSignCert = createFromRootCA(servername, 1024);

  callback(null, tls.createSecureContext({
    key: selfSignCert.privateKey,
    cert: selfSignCert.certificate
  }));
};

const fakeServer = https.createServer({ SNICallback });


module.exports = fakeServer;