const Context = require('./context');
const requested = require('./requested');

/**
 * request handler
 * @param {Proxy} proxy 
 * @param {original node req} req 
 * @param {original node res} res 
 */
function requestHandler(proxy, protocol = 'http:', req, res) {
  const _context = new Context(protocol, req, res, proxy);

  proxy.emit('_useRequestRules', _context);
  proxy.emit('request', _context);
  !_context.hasReadBody && requested(_context);
}

module.exports = requestHandler;
