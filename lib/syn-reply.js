module.exports = function synReply(socket, code, reason, headers, cb) {
  try {
    const statusLine = `HTTP/1.1 ${code} ${reason}\r\n`;

    let headerLines = '';

    for (let key in headers) {
      headerLines += `${key}: ${headers[key]}\r\n`;
    }

    socket.write(`${statusLine}${headerLines}\r\n`, 'utf-8', cb);
  } catch (error) {
    cb(error);
  }
};