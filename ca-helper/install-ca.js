const { exec } = require('child_process');
const pooyDir = `${process.env.HOME}/.pooy`;
const ROOT_CA_NAME = 'pooy.proxy';
const CA_PREFIX = 'POOY';

module.exports = function installCA() {
  const CAPath = `${pooyDir}/${CA_PREFIX}_rootCA.crt`;
  const addCommand = `sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ${CAPath}`;

  // https://unix.stackexchange.com/questions/227009/osx-delete-all-matching-certificates-by-command-line
  const removeCommand = `security find-certificate -c "${ROOT_CA_NAME}" -a -Z | sudo awk '/SHA-1/{system("security delete-certificate -Z "$NF)}'`;

  // 因为每次生成的证书都是不一致的，确保证书能正常工作 所以 先删在装
  exec(removeCommand, (err, stdout, stderr) => {
    if (err) {
      console.log(err);
      return;
    }

    exec(addCommand, (err, stdout, stderr) => {
      if (err) {
        console.log(err.message);
        return;
      }

      console.log('✅ root ca installed.');
    });
  });
}
