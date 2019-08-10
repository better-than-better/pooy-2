const os = require('os');
const { exec } = require('child_process');
const pooyDir = `${process.env.HOME}/.pooy`;
const ROOT_CA_NAME = 'pooy.proxy';
const CA_PREFIX = 'POOY';

function command(CAPath, CAFileName, ROOT_CA_NAME) {
  const linux = {
    add: `sudo cp ${CAPath} /usr/local/share/ca-certificates && sudo update-ca-certificates`,
    remove: `sudo rm -f /usr/local/share/ca-certificates/${CAFileName}  && sudo update-ca-certificates`
  };

  const darwin = {
    add: `sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ${CAPath}`,
    remove: `security find-certificate -c "${ROOT_CA_NAME}" -a -Z | sudo awk '/SHA-1/{system("security delete-certificate -Z "$NF)}'`
  };

  return ({ linux, darwin })[os.platform()];
}

module.exports = function installCA() {
  const CAFileName = `${CA_PREFIX}_rootCA.crt`;
  const CAPath = `${pooyDir}/${CAFileName}`;
  const cmd = command(CAPath, CAFileName, ROOT_CA_NAME);

  // 因为每次生成的证书都是不一致的，确保证书能正常工作 所以 先删在装
  exec(cmd.remove, (err, stdout, stderr) => {
    if (err) {
      console.log(err);
      return;
    }

    exec(cmd.add, (err, stdout, stderr) => {
      if (err) {
        console.log(err.message);
        return;
      }

      console.log('✅ root ca installed.');
    });
  });
}
