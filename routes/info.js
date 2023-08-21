const Router = require("koa-router");
const router = new Router();
const SQL = require("./sql");
const sql = new SQL("wishes");
const CONFIG = require("../config")
const DEFAULT_CONFIG = require("../config.default")

async function getInfo(timestamp) {
    timestamp = typeof timestamp === "number" ? timestamp : Date.now();
    // Remove test data from before the movie was released
    let minTimestamp = new Date(CONFIG.min_public_time || DEFAULT_CONFIG.min_public_time).getTime();
    timestamp = Math.max(timestamp, minTimestamp);
    const data = await sql.all(`SELECT wishid, date, place, contact, reason, timestamp FROM wishes WHERE timestamp >= ?`, [timestamp]).catch(e => { throw e });
    return data;
}

router.post("/info/:ts?", async (ctx) => {
    if (ctx.header["content-type"] !== "application/x-www-form-urlencoded")
        return ctx.body = {
            status: "error",
            msg: "Content-Type must be application/x-www-form-urlencoded"
        }
    if (typeof ctx.params.ts === "undefined") ctx.params.ts = 0
    const timestamp = /^[0-9]+$/.test(ctx.params.ts || "") ? Number(ctx.params.ts) : ctx.params.ts;
    if (typeof timestamp !== "number")
        return ctx.body = {
            status: "error",
            msg: "Invalid parameter ts"
        }

    try {
        const data = await getInfo(timestamp).catch(e => { throw e });
        ctx.body = {
            status: "success",
            data: data
        }
    } catch (e) {
        console.error(e);
        return ctx.body = {
            status: "error",
            msg: "Internal Server Error"
        }
    }
})

module.exports = router;