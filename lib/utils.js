const os = require('os');
const fs = require('fs');
const { execSync } = require('child_process');
const { Stream } = require('stream');
const pooyDir = `${process.env.HOME}/.pooy`;

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

/**
 * 数据缓存到本地
 * @param {String} id
 * @param {Stream|Object} incoming
 * @param {String} filename
 */
exports.writeToLocalAsync = (id, incoming, filename) => {
  const tmpDir = `${pooyDir}/tmp`;

  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir);
  }

  const fileDir = `${tmpDir}/${id}`;

  if (!fs.existsSync(fileDir)) {
    fs.mkdirSync(fileDir);
  }

  const filePath = `${fileDir}/${filename}`;

  if (incoming instanceof Stream) {
    const output = fs.createWriteStream(filePath);

    incoming.pipe(output);
    return;
  }

  if (typeof incoming !== 'string') {
    incoming = JSON.stringify(incoming);
  }

  fs.writeFileSync(filePath, incoming);
};

/**
 * 清空
 */
exports.clearTmpDir = () => {
  execSync(`rm -rf ${pooyDir}/tmp`);
};
