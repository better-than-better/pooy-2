const transformStream = require('../modules/transform-stream');

module.exports = function responsed(context) {
  const { res, statusCode, headers, rate } = context.response;
  const { remoteResponse, proxy } = context;

  if (proxy.isPaused) return proxy.pausedResponse.push(context);

  res.writeHead(statusCode, headers);

  const body = transformStream(context.body || remoteResponse, rate);

  body.pipe(res);
  body.on('end', () => proxy.emit('responseEnd', context));
}