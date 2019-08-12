const Proxy = require('../');
const proxy = new Proxy();

const rules = [{
  test: (ctx) => {
    return /www\.baidu\.com/.test(ctx.url) && /html/.test(ctx.get('content-type'));
  },
  request: {
    headers: {}
  },
  response: {
    statusCode: 400,
    body: (body) => {
      return body.toString() + `<script>alert('FBI Warngin!!')</script>`;
    },
    headers: (headers) => ({...headers, 'proxy-agent': 'pooy'}),
    throttling: {
      download: 1024 * 10
    }
  }
}];

proxy.useRules(rules);

proxy.listen(4002, () => {
  console.log('proxy server start...\n');
});
