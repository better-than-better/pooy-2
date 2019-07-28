const http = require('http');
const url = require('url');
const EventEmitter = require('events');
const Context = require('./context');
const requestHandler = require('./request-hander');
const connectHandler = require('./connect-handler');

const caInit = require('../ca-helper/init');

const CONTEXT = Symbol('context');

class Proxy extends EventEmitter {
  constructor(props) {
    super(props);

    this[CONTEXT] = {};
    this.direct = false;
    this.on('request', (context) => {
      this.setContext(context);
    });
  }

  get context() {
    return this[CONTEXT];
  }

  /**
   * 设置 context
   * @param {Context} data 
   * @return {Context}
   * @api public
   */
  setContext(data) {
    const isObj = typeof data === 'object' && !!data;

    if (!(isObj && data.constructor === Context)) {
      throw(new TypeError('the parameter must be a Context'));
    }

    return this[CONTEXT] = data;
  }

  /**
   * 请求直连
   * @param {String} protocol
   * @param {original node req} req
   * @param {original node res} res
   * @return {Proxy} self
   * @api private
   */
  requestDirect(protocol, req, res) {
    const path = req.headers.path || url.parse(req.url).path;
    
    const reqOptions = {
      host: req.headers.host.split(':')[0],
      port: +req.headers.host.split(':')[1] || protocol === 'http:' ? 80 : 443,
      path: path,
      method: req.method,
      headers: req.headers
    };

    const httpClient = http.request(reqOptions, (remoteResponse) => {
      res.writeHead(remoteResponse.statusCode, remoteResponse.headers);
      remoteResponse.pipe(res);
    });

    req.pipe(httpClient);

    httpClient.on('error', (err) => {
      this.emit('error', err, this.context);
      res.writeHead(502, err.message, { 'content-type': 'text/plain' });
      res.end();
    });

    return this;
  }

  /**
   * 事件订阅
   * @param {Server} server
   * @return {Proxy} self
   * @api private
   */
  subscribeEvent(server) {
    server.on('request', requestHandler.bind(null, this));
    server.on('connect', connectHandler.bind(null, this));
    server.on('upgrade', (res, socket, upgradeHead) => {
      socket.end();           
    });
    return this;
  }

  /**
   * 启动服务
   * @param {Maxed} ...
   * @return {Server}
   * @api public
   */
  listen(...arg) {
    const proxyServer = http.createServer();

    caInit();
    this.subscribeEvent.call(this, proxyServer);
    return proxyServer.listen(...arg);
  }
}

module.exports = Proxy;
