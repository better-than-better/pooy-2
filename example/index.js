const Proxy = require('../');
const fs = require('fs');

const proxy = new Proxy();

proxy.direct = false;

proxy.on('error', (err, ctx) => {
  // console.log('onError', err)
});

// 接收到了 client 的请求 并同步请求 real remote server
// 在这里可以控制请求的速率 by ctx.throttling()
proxy.on('request', async (ctx) => {
  console.log(ctx.url);
});

// client 请求结束
proxy.on('requestEnd', (ctx) => {
  // console.log(ctx.id, 'onRequestEnd', ctx.method, ctx.protocol, ctx.host, ctx.url);
});

// 只要对 ctx.body 进行读的操作，此 response 一定是等到 real remote server 响应完再触发的
// 若不不存在在 ctx.body 的读操作时，此 response 是与 real remote server 同步响应的
proxy.on('response', async (ctx) => {
  if (/html/.test(ctx.get('content-type'))) {
    ctx.throttling({ download: 1024 });
    const body = await ctx.getBody();

    ctx.removeHeader('content-security-policy');

    ctx.body = body + '<script>console.log("0"); alert("FBI warning!"); console.log("?");</script>';
  }
  
  ctx.setHeader('proxy-agent', 'pooy');
  // console.log(ctx.id, 'onResponse', ctx.method, ctx.protocol, ctx.host, ctx.url);
});

proxy.on('responseEnd', (ctx) => {
  // console.log(ctx.id, 'onResponseEnd', ctx.method, ctx.protocol, ctx.host, ctx.url);
});

proxy.listen(4002, () => {
  console.log('proxy server start...\n');
});
