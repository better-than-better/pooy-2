const createRootCA = require('./create-root-ca');
const createFromRootCA = require('./create-from-root-ca');
const installCA = require('./install-ca');

module.exports = function caInit() {
  createRootCA();
  createFromRootCA();
  installCA();
};
