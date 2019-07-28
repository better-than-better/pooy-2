const fs = require('fs');
const forge = require('node-forge');
const CA_PREFIX = 'POOY';
const pooyDir = `${process.env.HOME}/.pooy`;

module.exports = function createFromRoot(domain = 'pooy@proxy', RSABits = 1024) {

  // pem file content
  const rootCAPem = fs.readFileSync(`${pooyDir}/${CA_PREFIX}_rootCA.crt`);
  const rootCAPrivateKeyPem = fs.readFileSync(`${pooyDir}/${CA_PREFIX}_private_key.pem`);

  // 拿到 rootCA 的信息
  const rootCA = forge.pki.certificateFromPem(rootCAPem);
  const privateKey = forge.pki.privateKeyFromPem(rootCAPrivateKeyPem);

  const keys = forge.pki.rsa.generateKeyPair(RSABits);
  const cert = forge.pki.createCertificate();

  cert.publicKey = keys.publicKey;
  cert.serialNumber = (new Date()).getTime() + '';
  cert.validity.notBefore = new Date();
  cert.validity.notBefore.setFullYear(cert.validity.notBefore.getFullYear() - 1);
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 1);

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
      value: 'https://pooy.hxtao.xyz'
    }
  ];

  const extenAttrs = [
    {
      name: 'basicConstraints',
      critical: true,
      cA: false
    },
    {
      name: 'keyUsage',
      critical: true,
      digitalSignature: true,  // 必须为 true
      contentCommitment: true,
      keyEncipherment: true,
      dataEncipherment: true,
      keyAgreement: true,
      keyCertSign: true,
      cRLSign: true,
      encipherOnly: true,
      decipherOnly: true
    },
    {
      name: 'subjectKeyIdentifier'
    },
    {
      name: 'extKeyUsage',
      serverAuth: true,
      clientAuth: true,
      codeSigning: true,
      emailProtection: true,
      timeStamping: true
    },
    {
      name:'authorityKeyIdentifier'
    },
    {
      name: 'subjectAltName',
      altNames: [{
        type: 2, // URI
        value: domain
      }]
    }
  ];

  cert.setIssuer(rootCA.subject.attributes);
  cert.setSubject(attrs);
  cert.setExtensions(extenAttrs);
  cert.sign(privateKey, forge.md.sha256.create());

  // PEM-format keys and cert
  const pem = {
    privateKey: forge.pki.privateKeyToPem(keys.privateKey),
    publicKey: forge.pki.publicKeyToPem(keys.publicKey),
    certificate: forge.pki.certificateToPem(cert)
  };

  return pem;
}