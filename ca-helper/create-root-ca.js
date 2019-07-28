const fs = require('fs');
const forge = require('node-forge');
const CA_PREFIX = 'POOY';
const pooyDir = `${process.env.HOME}/.pooy`;

/**
 * 自建 CA
 * @param {String} domain
 * @param {NUmber} RSABits
 */
module.exports = function createRootCA(domain = 'pooy.proxy', RSABits = 1024) {
  const keys = forge.pki.rsa.generateKeyPair(RSABits);
  const cert = forge.pki.createCertificate();

  cert.publicKey = keys.publicKey;
  cert.serialNumber = (new Date()).getTime() + '';
  cert.validity.notBefore = new Date();
  cert.validity.notBefore.setFullYear(cert.validity.notBefore.getFullYear() - 5);
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 20);

  const attrs = [
    {
      name: 'commonName',
      value: domain
    },
    {
      name: 'countryName',
      value: 'CN'
    },
    {
      shortName: 'ST',
      value: 'ZheJiang'
    },
    {
      name: 'localityName',
      value: 'HangZhou'
    },
    {    
      name: 'organizationName',
      value: 'POOY'
    },
    {
      shortName: 'OU',
      value: 'https://www.52shangou.com'
    }
  ];

  const extenAttrs = [
    {
      name: 'basicConstraints',
      critical: true,
      cA: true
    },
    {
      name: 'keyUsage',
      critical: true,
      keyCertSign: true,
      digitalSignature: true,
      cRLSign: true
    },
    {
      name: 'subjectKeyIdentifier'
    }
  ];

  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.setExtensions(extenAttrs);
  cert.sign(keys.privateKey, forge.md.sha256.create());

  const pem = {
    privateKey: forge.pki.privateKeyToPem(keys.privateKey),
    publicKey: forge.pki.publicKeyToPem(keys.publicKey),
    certificate: forge.pki.certificateToPem(cert)
  };

  if (!fs.existsSync(pooyDir)) {
    fs.mkdirSync(pooyDir);
  }

  fs.writeFileSync(`${pooyDir}/${CA_PREFIX}_private_key.pem`, pem.privateKey);
  fs.writeFileSync(`${pooyDir}/${CA_PREFIX}_key.pem`, pem.publicKey);
  fs.writeFileSync(`${pooyDir}/${CA_PREFIX}_rootCA.crt`, pem.certificate);

  return pem;
}