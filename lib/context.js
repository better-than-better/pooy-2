const { IncomingMessage } = require('http');
const url = require('url');
const crypto = require('crypto');
const Stream = require('stream');
const statuses = require('statuses');
const resquested = require('./requested');
const responsed = require('./responsed');
// const { transformStream } = require('throttling-stream');

const UNIQUE_ID = Symbol('unique-id');
const REQUEST_BODY = Symbol('request-body');
const RESPONSE_BODY = Symbol('response-body');
const HAS_READ_BODY = Symbol('has-read-body');


class Context{
  constructor(protocol, req, res, proxy) {
    const headers = req.headers;
    const path = headers.path || url.parse(req.url || '').path;

    this[UNIQUE_ID] = crypto.randomBytes(16).toString('hex');
    this[HAS_READ_BODY] = false;  // 是否对真实响应做读取, 默认 false
    this[REQUEST_BODY] = null;
    this[RESPONSE_BODY] = null;

    // this.clientRequest = transformStream(req, {
    //   limit: 1024,
    //   delay: 1000,
    // });

    this.proxy = proxy;

    this.request = { body: null };

    Object.defineProperty(this.request, 'options', {
      configurable: false,
      enumerable: true,
      value: {
        protocol,
        host: headers.host.split(':')[0],
        port: +headers.host.split(':')[1] || protocol === 'http:' ? 80 : 443,
        path: path,
        method: req.method,
        headers,
        auth: req.auth
      },
      writable: false
    });

    Object.defineProperty(this.request, 'clientRequest', {
      configurable: false,
      enumerable: true,
      value: req,
      writable: false
    });
    
    // proxy response
    this.response = {
      body: null,
      remoteResponse: null
    };

    Object.defineProperty(this.response, 'res', {
      configurable: false,
      enumerable: true,
      value: res,
      writable: false
    });

    this.url = `${this.protocol}//${this.host}${this.path}`;

    this.throttlingOptions = {
      upload: 1024,
      download: 10,  // kb/m
      latency: 10,
    };
  }

  /**
   * 设置属性
   * @param {String} field
   * @param {String} value
   * @api public
   */
  set(field, value) {
    if (value === undefined || (typeof field !== 'string' && field.constructor !== Symbol)) return;

    const validFields = [
      UNIQUE_ID, REQUEST_BODY, RESPONSE_BODY, HAS_READ_BODY,
      'method', 'protocol', 'host',
      'path', 'hash', 'body',
      'proxy', 'clientRequest', 'remoteResponse',
      'request', 'response', 'throttlingOptions',
      'url'
    ];

    if (validFields.includes(field)) {
      this[field] = value;
    } else {
      this.setHeader(field, value);
    }
  }

  get(field) {
    const headers = this.remoteResponse ? his.response.headers : this.request.headers;

    return this[field] || headers[field];
  }

  /**
   * 设置请求方法
   * @param {String} value
   * @return {String} value
   * @api public
   */
  set method(value = '') {
    if (this.remoteResponse) return;

    const methodEnum = {
      get: 'GET',  // 请求一个指定资源的表示形式. 使用GET的请求应该只被用于获取数据
      head: 'HEAD',  // 请求一个与GET请求的响应相同的响应，但没有响应体
      post: 'POST',  // 用于将实体提交到指定的资源，通常导致在服务器上的状态变化或副作用
      put: 'PUT',  // 用于请求有效载荷替换目标资源的所有当前表示
      delete: 'DELETE',  // 删除指定的资源
      connect: 'CONNECT',  // 建立一个到由目标资源标识的服务器的隧道
      options: 'OPTIONS',  // 用于描述目标资源的通信选项
      trace: 'TRACE',  // 沿着到目标资源的路径执行一个消息环回测试
      patch: 'PATCH'  // 用于对资源应用部分修改
    };

    this.request.options.method = methodEnum[value.toLowerCase()] || 'GET';
  }

  get method() {
    return this.request.options.method;
  }

  /**
   * 协议头设置
   * @param {String} value
   * @return {String} value
   * @api public
   */
  set protocol(value = '') {
    if (this.remoteResponse) return;

    const protocolEnum = {
      http: 'http:',
      https: 'https:'
    };

    this.request.options.protocol = protocolEnum[value.toLowerCase()] || 'http:';
  }

  get protocol() {
    return this.request.options.protocol;
  }

  /**
   * 设置 host
   * @param {String} value
   * @return {String} value
   * @api public
   */
  set host(value) {
    if (this.remoteResponse) return;

    const { protocol } = this.request.options;

    this.request.options.host = value.split(':')[0];
    this.request.options.port = +value.split(':')[1] || protocol === 'http:' ? 80 : 443;
  }

  get host() {
    return this.request.options.host;
  }

  /**
   * 请求路径设置
   * @param {String}
   * @return {String} value
   * @api public
   */
  set path(value) {
    if (this.remoteResponse) return;

    value = value.toString();
    value = /^\//.test(value) ? value : '/' + value;

    this.request.options.path = value;
  }

  get path() {
    return this.request.options.path;
  }

  /**
   * 设置 headers
   * @param {Object} value
   * @return {Object} value
   * @api public
   */
  set headers(value) {
    this.setHeaders(value);
  }

  get headers() {
    return this.remoteResponse ? this.response.headers : this.request.headers;
  }

  /**
   * 设置 body
   * @param {String|Buffer|Stream|Object|Array} value
   * @return {String|Buffer|Stream|Object|Array} value
   * @api public
   */
  set body(value) {
    return this.setBody(value);
  }

  get body() {
    return this.remoteResponse ? this[RESPONSE_BODY] : this[REQUEST_BODY];
  }

  /**
   * 设置响应状态码
   * @returns {Number} statusCode
   * @param {Number}
   * @return {Number}
   * @api public
   */
  set statusCode(value) {
    value = parseInt(value, 10);
    this.response.statusCode = isNaN(value) ? 200 : value;
  }

  get statusCode() {
    return this.response.statusCode;
  }

  /**
   * 设置 remoteResponse
   * @param {IncomingMessage} value
   * @return {IncomingMessage} value
   * @api public
   */
  set remoteResponse(value) {
    this.setRemoteResponse(value);
  }

  get remoteResponse() {
    return this.response.remoteResponse;
  }

  /**
   * 设置 clientRequest
   * @param {IncomingMessage}
   * @return {IncomingMessage}
   * @api public
   */
  set clientRequest(value) {
    if (value !== null && value.constructor !== IncomingMessage) throw(new TypeError('clientRequest: expect `http.IncomingMessage`'));
    
    this.request.clientRequest = value;
  }

  get clientRequest() {
    return this.request.clientRequest;
  }

  /**
   * 挂载真实响应到 context
   * @param {original node res} value
   * @return {original node re} value
   * @api public
   */
  setRemoteResponse(value) {
    if (value !== null && value.constructor !== IncomingMessage) throw(new TypeError('remoteResponse: expect `http.IncomingMessage`'));

    this.response.headers = value.headers;
    this.response.statusCode = value.statusCode;

    Object.defineProperty(this.response, 'remoteResponse', {
      configurable: false,
      enumerable: true,
      value,
      writable: false
    });
  }

  /**
   * 设置头部 （请求头 or 响应头）
   * @param {String} name
   * @param {String} value
   * @return {Object} headers
   * @api public
   */
  setHeader(name, value) {
    name = name.toLowerCase();
    value = value.toString();

    if(this.remoteResponse) {
      this.response.headers[name] = value;
    } else {
      this.request.headers[name] = value;
    }
  }

  /**
   * 设置 headers
   * @param {Object} value
   * @return {Object} value
   * @api public
   */
  setHeaders(value) {
    const headers = this.remoteResponse ? this.response.headers : this.request.headers;

    if (Object.prototype.toString.call(value) !== '[object Object]') return headers;

    if (this.remoteResponse) {
      this.response.headers = value;
    } else {
      this.request.headers = value;
    }
  }

  setBody(value) {
    if (value.constructor !== IncomingMessage) throw(new TypeError('clientRequest: expect `http.IncomingMessage`'));

    return this.remoteResponse ? this.setResponseBody(value) : this.setRequestBody(value);
  }

  /**
   * 设置响应体
   * 
   * @param {String|Buffer|Object|Stream} value
   * @return {String|Buffer|Object|Stream} body
   * @api public
   */
  setResponseBody(value) {
    this[RESPONSE_BODY] = value;
    if (value ===  null) {
      if (statuses.empty(this.statusCode)) this.statusCode = 204;

      this.removeHeader('content-type');
      this.removeHeader('content-length');
      this.removeHeader('transfer-encoding');
      return value;
    }

    let contentType = this.getHeader('content-type');

    const isBuffer = Buffer.isBuffer(value);

    if (value instanceof Stream) {
      if (!contentType) contentType = 'application/octet-stream';

      this.removeHeader('content-length');
      return value;
    }

    if (typeof value === 'string' || isBuffer) {
      if (!contentType) contentType = isBuffer ? 'application/octet-stream' : 'text/plain';

      this.setHeader('content-length', Buffer.byteLength(value));
      this.setHeader('content-type', contentType);

      return value;
    }

    value = JSON.stringify(value);
    this.setHeader('content-length', value.length);
    this.setHeader('content-type', 'application/json');
    this[RESPONSE_BODY] = value;
  }

  /**
   * 设置请求体
   * 
   * @param {String|Buffer|Object|Stream} value
   * @return {String|Buffer|Object|Stream} body
   * @api public
   */
  setRequestBody(value) {
    this[REQUEST_BODY] = value;
  }

  /**
   * context 唯一 id
   * @return {String}
   * @api public
   */
  get id() {
    return this[UNIQUE_ID];
  }

  /**
   * 获取 proxy req
   * @api public
   */
  get req() {
    return this.request.req;
  }


  /**
   * 获取 proxy res
   * @api public
   */
  get res() {
    return this.response.res;
  }

  /**
   * 获取当前 body 是否已被读取
   * @return {Boolean}
   * @api public
   */
  get hasReadBody() {
    return this[HAS_READ_BODY];
  }

  /**
   * 获取响应体
   * @return {Promise}
   * @api public
   */
  getBody() {
    console.log('////get bidy')
    this[HAS_READ_BODY] = true;
    return new Promise((reslove, reject) => {
      const body = this.body;
      const hasRes = !!this.remoteResponse;

      if (body) reslove(body);

      const data = [];
      const incomingMessage = hasRes ? this.remoteResponse : this.clientRequest;

      incomingMessage.on('data', (chunk) => {
        data.push(chunk);
      });

      incomingMessage.on('end', () => {
        reslove(Buffer.concat(data));
        // this[HAS_READ_BODY] = false;

        // 利用 setTimeout 确保 responsed 处于当前调用栈之后
        setTimeout(() => hasRes ? responsed(this) : resquested(this));
      });
    });
  }

  /**
   * 节流控制
   * @param {Object} options
   * @api public
   */
  throttling(options) {
    // console.log('throttling options:', options);
  }

  /**
   * 获取头部
   * @param {String} field
   * @return String
   * @api public
   */
  getHeader(field) {
    field = field.toLowerCase();

    if(this.remoteResponse) {
      return this.response.headers[field];
    } else {
      return this.request.headers[field];
    }
  }

  /**
   * 移除头部
   * @param {String} field
   * @return Boolean
   * @api public
   */
  removeHeader(field) {
    field = field.toLowerCase();

    if(this.remoteResponse) {
      delete this.response.headers[field];
    } else {
      delete this.request.headers[field];
    }
  }
}

module.exports = Context;


// MIME Types
// https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Complete_list_of_MIME_types
