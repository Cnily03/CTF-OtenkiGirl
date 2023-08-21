const env = global.env = (process.env.NODE_ENV || "production").trim();
const isEnvDev = global.isEnvDev = env === "development";
const devOnly = (fn) => isEnvDev ? (typeof fn === "function" ? fn() : fn) : undefined
const CONFIG = require("./config"), DEFAULT_CONFIG = require("./config.default");
const PORT = CONFIG.server_port || DEFAULT_CONFIG.server_port;

const path = require("path");
const Koa = require("koa");
const bodyParser = require("koa-bodyparser");

const app = new Koa();

app.use(require('koa-static')(path.join(__dirname, './static')));
devOnly(_ => require("./webpack.proxies.dev").forEach(p => app.use(p)));
app.use(bodyParser({
    onerror: function (err, ctx) {
        // If the json is invalid, the body will be set to {}. That means, the request json would be seen as empty.
        if (err.status === 400 && err.name === 'SyntaxError' && ctx.request.type === 'application/json') {
            ctx.request.body = {}
        } else {
            throw err;
        }
    }
}));

[
    "info",
    "submit"
].forEach(p => { p = require("./routes/" + p); app.use(p.routes()).use(p.allowedMethods()) });

app.listen(PORT, () => {
    console.info(`Server is running at port ${PORT}...`);
})

module.exports = app;