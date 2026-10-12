const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
// React Native Web preview uses its own SQLite database; the approved prototype stays separate.
config.resolver.assetExts.push('wasm');
config.server.enhanceMiddleware = (middleware) => (request, response, next) => {
  response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  response.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  return middleware(request, response, next);
};
module.exports = config;
