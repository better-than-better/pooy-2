## Pooy (0.0.1-alpha1🐣)

![](https://img.shields.io/badge/node->%3D7.6.0-brightgreen.svg)

[中文文档](./README-zh.md)

A proxy service based on NodeJS EventEmitter. It can realize request monitoring and packet capture, support modification request body and response body, and provide secondary development capability at each stage of the request.

## Installation

Pooy requires node v7.6.0 or higher for ES2015 and async function support.

```bash
npm install pooy
```

## Example

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

## Events

A complete request response in pooy will go through four kinds of events `request` `requestEnd` `response` `responseEnd`, which will trigger the `error` event when an unexpected error occurs.


## Context

In each event callback, there is a `context` object that wraps its own `response` and `request` objects, as well as the original request or response objects `clientRequest` and `remoteResponse` that mount the current event. Additional for easy modification or retrieval of some request or response body related information `context` also provides `setHeader` `getHeader` `removeHeader` `setBody` `getBody` and other series of method functions

## Document

- [proxy.on('request', function)](./api.md#proxyonrequest-function)
- [proxy.on('requestEnd', function)](./api.md#proxyonrequestend-function)
- [proxy.on('response', function)](./api.md#proxyonresponse-function)
- [proxy.on('responseEnd', function)](./api.md#proxyonresponseend-function)
- [proxy.on('error', function)](./api.md#proxyonerror-function)
- [proxy.listen](./api.md#proxylistenlisten-function)
- [context](./api.md#context)

## License

[MIT](./LICENSE)
