const os = require('os');
const fs = require('fs');
const multiparty = require('multiparty');
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

  networkInterfaces && networkInterfaces.forEach(({ family, address }) => {
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
    const contentType = incoming.headers['content-type'];

    incoming.headers = incoming.headers;

    // 表单数据
    if (/multipart\/form-data/.test(contentType)) {
      const form = new multiparty.Form();
 
      form.parse(incoming, function(err, fields, files) {
        console.log(fields, files);

        Object.keys(files).forEach(name => {
          const filesPath = `${fileDir}/files`;

          if (!fs.existsSync(filesPath)) {
            fs.mkdirSync(filesPath);
          }

          fields[name] = files[name].map((file, i) => {
            const fileId = (Math.random()).toString(36).slice(2);

            fs.copyFile(file.path, `${filesPath}/${fileId}`, () => {});
            return {
              id: fileId,
              size: file.size,
              originalFilename: file.originalFilename,
            }
          });
        });
        fs.writeFile(filePath, JSON.stringify(fields), () => {});
      });
    } else {
      const output = fs.createWriteStream(filePath);

      incoming.pipe(output);
    }

    return;
  }

  if (typeof incoming !== 'string') {
    incoming = JSON.stringify(incoming);
  }

  fs.writeFile(filePath, incoming, () => {});
};

/**
 * 读取本地数据
 * @param {String} id
 */
exports.readFromLocalAsync = (id, filename) => {
  const filePath = `${pooyDir}/tmp/${id}/${filename}`;

  if (!fs.existsSync(filePath)) {
    console.log('路径不存在', id, filename);
    return null;
  }

  return fs.createReadStream(filePath);
};

/**
 * 清空
 */
exports.clearTmpDir = () => {
  execSync(`rm -rf ${pooyDir}/tmp`);
};
