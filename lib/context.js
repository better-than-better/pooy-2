const url = require('url');
const crypto = require('crypto');
const Stream = require('stream');
const statuses = require('statuses');
const responsed = require('./responsed');

const UNIQUE_ID = Symbol('unique-id');
const BODY = Symbol('body');
const HAS_READ_BODY = Symbol('has-read-body');

class Context{
  constructor(protocol, req, res, proxy) {
    const headers = req.headers || {};
    const path = headers.path || url.parse(req.url || '').path;

    this[UNIQUE_ID] = crypto.randomBytes(16).toString('hex');
    this[HAS_READ_BODY] = false;  // 是否对真实响应做读取, 默认 false
    this[BODY] = null;

    this.clientRequest = req;
    this.remoteResponse = null;

    this.protocol = protocol;
    this.method = req.method;
    this.url = path;
    this.host = headers.host;
    this.proxy = proxy;

    // proxy request
    this.request = {
      options: {
        host:  headers.host.split(':')[0],
        port: +headers.host.split(':')[1] || protocol === 'http:' ? 80 : 443,
        path: path,
        method: req.method,
        headers,
        protocol
      },
      headers,
      req
    };
    
    // proxy response
    this.response = {
      body: '',
      res
    };

    this.throttlingOptions = {
      upload: 1024,
      download: 10,  // kb/m
      latency: 10,
    }
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
   * 节流控制
   * @param {Object} options
   * @api public
   */
  throttling(options) {
    console.log('throttling options:', options)
  }

  /**
   * 设置头部 （请求头 or 响应头）
   * @param {String} name
   * @param {String} value
   * @api public
   */
  setHeader(name, value) {
    name = name.toLowerCase();

    if(this.remoteResponse) {
      this.response.headers[name] = value;
    } else {
      this.request.headers[name] = value;
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
   * 挂载真实响应到 context
   * @param {original node res} res 
   */
  setRemoteResponse(res) {
    this.remoteResponse = res;
    this.response = {
      ...this.response,
      headers: res.headers,
      statusCode: res.statusCode
    };
  }

  get hasReadBody() {
    return this[HAS_READ_BODY];
  }

  set hasReadBody(val) {
    return this[HAS_READ_BODY];
  }

  set body(value) {
    return this.setBody(value);
  }

  get body() {
    return this[BODY];
  }

  /**
   * 设置响应体
   * 
   * @param {String|Buffer|Object|Stream} value
   * @return {String|Buffer|Object|Stream} body
   * @api public
   */
  setBody(value) {
    this[BODY] = value;

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
    this[BODY] = value;
  }

  /**
   * 获取响应体
   * @return {Promise}
   * @api public
   */
  getBody() {
    this[HAS_READ_BODY] = true;
    return new Promise((reslove, reject) => {
      if (this[BODY]) reslove(this[BODY]);

      const data = [];
      const res = this.remoteResponse;

      res.on('data', (chunk) => {
        data.push(chunk);
      });

      res.on('end', () => {
        reslove(Buffer.concat(data));

        // 利用 setTimeout 确保 responsed 处于当前调用栈之后
        setTimeout(() => responsed(this));
      });
    });
  }

  /**
   * 设置响应状态码
   * @returns {Number} statusCode
   * @param {Number}
   */
  set statusCode(value) {
    this.response.statusCode = value;
  }

  /**
   * 获取响应状态码
   * @return {Number} statusCode
   * @api public
   */
  get statusCode() {
    return this.response.statusCode;
  }
}

module.exports = Context;


// MIME Types
// https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Complete_list_of_MIME_types
