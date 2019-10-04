const url = require('url');
const http = require('http');
const https = require('https');
const EventEmitter = require('events');
const Context = require('./context');
const Rules = require('./rules');
const { requestHandler, connectHandler } = require('./modules/handlers');
const { writeToLocalAsync, clearTmpDir } = require('./utils');
const transformStream = require('./modules/transform-stream');
const requested = require('./executor/requested');
const responsed = require('./executor/responsed');
const caInit = require('../ca-helper/init');

const CONTEXT = Symbol('context');
const RULES = Symbol('rules');
const IS_PAUSE = Symbol('is-pause');

class Proxy extends EventEmitter {
  constructor(props) {
    super(props);

    clearTmpDir();

    this[CONTEXT] = {};
    this[RULES] = new Rules();
    this[IS_PAUSE] = false;
    this.direct = false;
    this.pausedRequest = [];
    this.pausedResponse = [];
    this.on('request', (context) => {
      this.setContext(context);
    });
    this.on('_saveReqData', (context) => {
      writeToLocalAsync(context.id, context.body || context.clientRequest, 'req_body');
      writeToLocalAsync(context.id, context.request.headers, 'req_header');
    });
    this.on('_saveResData', (context) => {
      writeToLocalAsync(context.id, context.statusCode, 'res_status_code');
      writeToLocalAsync(context.id, context.body || context.remoteResponse, 'res_body');
      writeToLocalAsync(context.id, context.response.headers, 'res_header');
    });
    this.on('_useRequestRules', this[RULES].go.bind(this[RULES], 'request'));
    this.on('_useResponseRules', this[RULES].go.bind(this[RULES], 'response'));
    this.on('error', (err, ctx) => {
      if (this.log) {
        console.log('onError', err);
      }
    });
  }

  get context() {
    return this[CONTEXT];
  }

  get rules() {
    return this[RULES];
  }

  get isPaused() {
    return this[IS_PAUSE];
  }

  get port() {
    return this.proxyServer.address().port;
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
      protocol,
      method: req.method,
      host: req.headers.host.split(':')[0],
      port: +req.headers.host.split(':')[1] || (protocol === 'http:' ? 80 : 443),
      path: path,
      headers: req.headers,
      auth: req.auth
    };
    const client = protocol === 'https:' ? https : http;

    const httpClient = client.request(reqOptions, (remoteResponse) => {
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
    server.on('request', requestHandler.bind(null, this, 'http:'));
    server.on('connect', connectHandler(this));
    server.on('upgrade', (res, socket, upgradeHead) => {
      socket.end();           
    });
    return this;
  }

  /**
   * 规则匹配
   * @param  {Array} rules
   * @return {Array} rules
   * @api public
   */
  useRules(rules) {
    this[RULES].add(rules);
  }

  /**
   * 暂停
   */
  pause() {
    this[IS_PAUSE] = true;
  }

  /**
   * 恢复
   */
  resume() {
    this[IS_PAUSE] = false;
    this.pausedRequest.forEach((v) => requested(v));
    this.pausedResponse.forEach((v) => responsed(v));
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
    this.proxyServer = proxyServer;
    return proxyServer.listen(...arg);
  }
}

module.exports = Proxy;
