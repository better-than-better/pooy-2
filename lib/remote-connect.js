const net = require('net');
const { synReply } = require('./helper');

/**
 * for https
 * @param {Object} requestOptions
 * @param {original node socket} socket
 */
module.exports = function remoteConnect(requestOptions, socket) {
  const tunnel = net.createConnection(requestOptions, function() {
    const headers = {
      'connection': 'keep-alive',
      'proxy-agent': 'pooy'
    };

    const onerror = function(error) {
      if (error) {
        tunnel.end();
        socket.end();
        return;
      }

      tunnel.pipe(socket);
      socket.pipe(tunnel);
    };

    synReply(socket, 200, 'connection established', headers, onerror);
  });

  tunnel.setNoDelay(true);
  tunnel.on('error', onTargetError);

  function onTargetError(e) {
    synReply(socket, 502, "Tunnel Error", {}, function() {
      try {
        socket.end();
      } catch (e) {
        console.log(e)
      }
    });
  }
};
