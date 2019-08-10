const Stream = require('stream');

module.exports = function responsed(context) {
  const { res, statusCode, headers } = context.response;
  const { remoteResponse, proxy } = context;

  if (proxy.isPaused) return proxy.pausedResponse.push(context);

  const data = [];
  const emmitEnd = () => proxy.emit('responseEnd', context);

  res.writeHead(statusCode, headers);

  let body = context.body;

  if (Buffer.isBuffer(body) || typeof context.body === 'string') {
    return res.end(body, emmitEnd);
  }

  if (body instanceof Stream) {
    body.pipe(res);
    body.on('end', emmitEnd);
    return;
  }

  if (body && typeof body === 'object') {
    return res.end(JSON.stringify(body), () => emmitEnd);
  }

  remoteResponse.on('data', (chunk) => {
    res.write(chunk);
    data.push(chunk);
  });

  remoteResponse.on('end', () => {
    proxy.emit('_useResponseRules', context);
    res.end(emmitEnd);
  });
}