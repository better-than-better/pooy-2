## Pooy (0.0.1-alpha1🐣)

![](https://img.shields.io/badge/node->%3D7.6.0-brightgreen.svg)

一个基于 NodeJS EventEmitter 的代理服务。可实现请求监控抓包、支持修改请求体和响应体，在请求的各个阶段提供二次开发的能力。

## 安装

pooy 依赖 node >= 7.6 ，因为涉及到自签根证书的自动安装更新所以实际运行服务时需要以管理员权限运行

```bash
npm install pooy
```

## 这是一个 🌰

```js
const Pooy = require('pooy');
const proxy = new Pooy();

proxy.on('error', (err, ctx) => {
  console.log('oops, something went wrong!', err);
  consle.log(ctx);
});

proxy.on('request', (ctx) => {
  consle.log(ctx.method, ctx.protocol, ctx.host, ctx.url);
});

proxy.on('response', (ctx) => {
  ctx.setHeader('proxy-agent', 'pooy');
});

proxy.listen(9696, () => {
  console.log('proxy server run at 9696...');
});
```

## 事件通知

在 pooy 中一次完整的请求应答，会依次经历 `request` `requestEnd` `response` `responseEnd` 四个事件，当发生意料之外的错误时会触发 `error` 事件。


## Context

在每个事件回调中，都有一个 `context` 对象，里面封装了自己的 `response` 和 `request` 对象，以及挂载当前事件的原生请求或响应对象 `clientRequest` 和 `remoteResponse`。额外的为了便捷的修改或获取一些请求或响应体相关的信息 `context` 还提供了 `setHeader` `getHeader` `removeHeader` `setBody` `getBody` 等系列方法函数

## 文档

- [proxy.on(eventName, function)](./api.md#proxyon)
- [proxy.listen](./api.md#proxylisten)
- [context](./api.md#context)

## TODO

平台兼容性（目前仅支持 macOS）

## License

[MIT](./LICENSE)
