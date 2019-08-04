class Rules {
  constructor() {
    this.middleware = {
      request: [],
      response: []
    };
  }

  /**
   * 开始处理请求
   * @param {Array} rules
   * @param {Context} ctx
   * @api private
   */
  async requestHandler(rule, ctx) {
    const { request } = rule;

    let body = request.body;
    let headers = request.headers;

    if (typeof rule.body === 'function') {
      body = body(await ctx.getBody());
    }

    if (typeof headers === 'function') {
      headers = headers(ctx.request.headers);
    }

    ctx.set('method', request.method);
    ctx.set('protocol', request.protocol);
    ctx.set('host', request.host);
    ctx.set('pathname', request.pathname);
    ctx.set('hash', request.hash);

    ctx.setHeaders(request.headers);
    ctx.setBody(body);

    ctx.throttling(request.throttling);
  }

  /**
   * 开始响应请求
   * @param {Array} rules
   * @param {Context} ctx
   * @api private
   */
  async responseHandler(rule, ctx) {
    const { response } = rule;

    let body = response.body;
    let headers = response.headers;

    if (typeof rule.body === 'function') {
      body = body(await ctx.getBody());
    }

    if (typeof headers === 'function') {
      headers = headers(ctx.response.headers);
    }

    ctx.setHeaders(response.headers);
    ctx.setBody(body);

    ctx.throttling(request.throttling);
  }

  /**
   * 添加规则
   * @param {Array} rules
   * @api public
   */
  add(rules) {
    if (!Array.isArray(rules)) {
      throw (new TypeError(`rules expect 'array' but get '${typeof rules}'`));
    }

    rules.forEach((rule) => {
      this.middleware.request.push(this.requestHandler.bind(null, rule));
      this.middleware.response.push(this.responseHandler.bind(null, rule));
    });

    return this;
  }

  /**
   * 重置清空规则
   * @api public
   */
  reset() {
    this.middleware = {
      request: [],
      response: []
    }

    return this;
  }

  /**
   * 消费规则
   * @param {String} type `request` or `response`
   * @param {Context} context 
   * @api public
   */
  async go(type, context) {
    type = type === 'request' ? 'request' : 'response';

    const middlewares = this.middleware[type];
    const len = middlewares.len;

    for(let i = 0; i < len; i++) {
      await middlewares[i](context);
    }
  }
}

module.exports = Rules;