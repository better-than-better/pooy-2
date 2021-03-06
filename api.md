## proxy

```js
const Pooy = require('pooy');
const proxy = new Pooy();
```

## proxy.on

### proxy.on('request', function)

```js
proxy.on('request', (ctx) => {
  // set request header
  ctx.setHeader('user-agent', 'pooy@proxy');
});
```

### proxy.on('requestEnd', function)

```js
proxy.on('requestEnd', (ctx) => {
  // show request end info
  consle.log('request end:', `${ctx.method} -> ${ctx.host}${ctx.url}`);
});
```

### proxy.on('response', function)

```js
proxy.on('response', (ctx) => {
  // set response header
  ctx.setHeader('proxy-agent', 'pooy@0.0.1-alpha1');
});
```

### proxy.on('responseEnd', function)

```js
proxy.on('requestEnd', (ctx) => {
  // show response end info
  consle.log('response end:', `${ctx.method} -> ${ctx.host}${ctx.url}`);
});
```

### proxy.on('error', function)

```js
proxy.on('error', (err, ctx) => {
  // error handler
  console.log('oops, something went wrong!', err);
  consle.log(ctx);
});
```

## proxy.listen

```js
proxy.listen(9696, () => {
  console.log('proxy server run at 9696...');
});
```

## proxy.useRules

```js
const rules = [{
  test: (ctx) => {
    return ctx.url === 'www.baidu.com' && ctx.method === 'GET';
  },
  response: {
    statusCode: 400,
    body: (body) => body + `<script>alert('FBI Warning!!')</script>`,
    headers: {},
    throttling: {
      download: 1024
    }
  }
}];

proxy.useRules(rules);
```



## proxy.direct

```js
proxy.direct = true;
```

为 `true` 时系统直连，反之流量走 proxy

## context

### context.id

唯一标识 id

### context.request

proxy request 对象，支持重写（仅在 request 时）

```js
{
  options: {
    host: '请求 host',
    port: '目标端口: https 默认 443, http 默认80',
    path: '请求路径',
    method: '请求方法: GET POST PUT DELETE OPTIONS 等',
    headers: '请求头',
    protocol: '协议: http or https'
  },
  headers: '请求头',
  req: '原生 node request 对象'
}
```

### context.response

proxy response 对象，支持重写（仅在 response 时）

```js
{
  body: '响应内容',
  res: '原生 node response 对象'
};
```

### context.clientRequest

来自系统的当前请求，原生 node request 对象

### context.remoteResponse

来自真实服务的响应，原生 node response 对象

### context.throttling

网络节流控制

```js

proxy.on('request', (ctx) => {
  ctx.throttling({
    upload: 1024  // 每秒传输的字节数
  });
});

proxy.on('response', (ctx) => {
  ctx.throttling({
    download: 1024  // 每秒传输的字节数
  });
});

```

### context.protocol

当前请求的协议 http or https，支持重写（仅在 request 时）

### context.method

当前请求的方法，支持重写（仅在 request 时）

### context.url

当前请求的路径，支持重写（仅在 request 时）

### context.host

当前请求的 host，支持重写（仅在 request 时）

### context.getBody

获取响应内容，这是一个异步方法

```js
proxy.on('response', async (ctx) => {
  const contextType = ctx.getHeader('content-type');
  const body = await ctx.getBody();

  if (/html/.test(contentType)) {
    ctx.body = body + `<script>alert('opps!!')</script>`;
  }
}
```

### context.setBody

设置响应体，效果等同于直接赋值给 `ctx.body`

```js
proxy.on('response', async (ctx) => {
  ctx.setBody('hello world.');
}
```

### context.pause

```js
proxy.on('response', async (ctx) => {
  ctx.pause();
}
```

### context.resume

```js
proxy.on('response', async (ctx) => {
  ctx.resume();
}
```

### proxy.useRules

```js
proxy.useRules([{
  testField: 'url',  // url requestHeaders responseHeaders
  test: /baidu\.com/,
  request: {
    protocol: 'https',
    host: 'hxtao.xyz:8001',
    pathname: '/some',
    hash: '#12',
    method: 'GET',
    throttling: { upload: 1024 },
    body: (body) => body + '..',
    headers: (headers) => ({ ...headers, ...{ 'cookies': 'name=hxtao' } })
  },
  response: {
    statusCode: 200,
    throttling: { download: 1024 },
    body: (body) => body + '..',
    headers: (headers) => ({ ...headers, ...{ 'hello': 'world' } })
  },
  desc: '这是一个描述'
}]);
```