class Rules {
  constructor() {
    this.middleware = {
      request: [],
      response: []
    };
  }

  /**
   * 开始处理请求
   * @param {Object} rule
   * @param {Context} ctx
   * @api private
   */
  async requestHandler(rule, ctx) {
    if (!rule.test(ctx)) return;

    const { request } = rule;

    let body = request.body;
    let headers = request.headers;

    if (typeof body === 'function') {
      body = body(await ctx.getBody());
    }

    if (typeof headers === 'function') {
      headers = headers(ctx.request.headers);
    }

    request.method && ctx.set('method', request.method);
    request.protocol && ctx.set('protocol', request.protocol);
    request.host && ctx.set('host', request.host);
    request.pathname && ctx.set('pathname', request.pathname);  // TODO:  path or pathname
    request.pathname && ctx.set('path', request.pathname);

    headers && ctx.setHeaders(headers);
    body && ctx.setBody(body);

    request.throttling && ctx.throttling(request.throttling);
  }

  /**
   * 开始响应请求
   * @param {Object} rule
   * @param {Context} ctx
   * @api private
   */
  async responseHandler(rule, ctx) {
    if (!rule.test(ctx)) return;

    const { response } = rule;

    let body = response.body;
    let headers = response.headers;

    if (typeof body === 'function') {
      body = body(await ctx.getBody());
    }

    if (typeof headers === 'function') {
      headers = headers(ctx.response.headers);
    }

    headers && ctx.setHeaders(headers);
    body && ctx.setBody(body);
    response.statusCode && ctx.setStatusCode(response.statusCode);
    response.throttling && ctx.throttling(response.throttling);
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
      if (typeof rule.test !== 'function') {
        throw TypeError('Proxy rules: rule test must be a function');
      }

      rule.request && this.middleware.request.push(this.requestHandler.bind(null, rule));
      rule.response && this.middleware.response.push(this.responseHandler.bind(null, rule));
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
    const len = middlewares.length;

    for(let i = 0; i < len; i++) {
      await middlewares[i](context);
    }
  }
}

module.exports = Rules;