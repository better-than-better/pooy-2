const http = require('http');
const https = require('https');
const responsed = require('./responsed');

/**
 * 请求远程真实服务
 * @param {Context} context
 */
module.exports = function remoteRequest(context) {
  const { proxy, clientRequest } = context;
  const proxyResponse = context.response.res;
  const reqOptions = context.request.options;

  // 暂且去除 encoding
  delete reqOptions.headers['accept-encoding'];

  if (/http:\/\/127\.0\.0\.1/.test(reqOptions.headers['referer'])) {
    delete reqOptions.headers['referer'];
  }

  const client = reqOptions.protocol === 'http:' ? http : https;

  const agent = client.request({ ...reqOptions, agent: new client.Agent({ keepAlive: true }) }, (remoteResponse) => {
    context.setRemoteResponse(remoteResponse);
    proxy.emit('_useResponseRules', context);
    proxy.emit('response', context);
    !context.hasReadBody && responsed(context);
  });

  const reqBody = [];

  agent.on('error', (e) => {
    e.requestInfo = reqOptions;
    proxy.emit('error', e, context);
    proxyResponse.writeHead(502, 'Proxy fetch failed');
  });

  clientRequest.on('data', (chunk) => {
    agent.write(chunk);
    reqBody.push(chunk);
  });

  clientRequest.on('end', () => {
    if (/(json|x-www-form-urlencoded)/.test(clientRequest.headers['content-type'])) {
      context.requestBody = Buffer.concat(reqBody);
    }
    agent.end();
    proxy.emit('requestEnd', context);
  });

  proxyResponse.on('close', () => agent.abort());
}
