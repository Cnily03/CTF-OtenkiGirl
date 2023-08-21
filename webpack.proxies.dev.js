const koaServerHttpProxy = require("koa-server-http-proxy");
const WEBPACK_PORT = require("./webpack.config").devServer.port;

let proxies = []

console.log("Passing static path " + "/v" + " to webpack dev server port " + WEBPACK_PORT.toString());
proxies.push(koaServerHttpProxy("/v", {
    target: "http://localhost:" + WEBPACK_PORT,
    pathRewrite: { '^/v': '' },
    changeOrigin: true
}))

console.log("Passing static path " + "/sw.js" + " tot " + "/v/sw.js");
proxies.push(koaServerHttpProxy("/sw.js", {
    target: "http://localhost:" + WEBPACK_PORT,
    pathRewrite: { '^/sw.js': '/sw.js' },
    changeOrigin: false
}))

module.exports = proxies