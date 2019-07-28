const os = require('os');

/**
 * 简单写下只适用 mac os
 */
exports.getIps = function () {
  let IPv4 = '';
  let IPv6 = '';

  if (os.type() !== 'Darwin') {
    return {}
  }

  const networkInterfaces = os.networkInterfaces().en0;

  networkInterfaces.forEach(({ family, address }) => {
    if (family === 'IPv4') {
      IPv4 = address;
    }

    if (family === 'IPv4') {
      IPv6 = address;
    }
  });

  return {
    IPv4,
    IPv6
  }
};
