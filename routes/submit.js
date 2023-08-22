const Router = require("koa-router");
const router = new Router();
const SQL = require("./sql");
const sql = new SQL("wishes");
const { rndID, mergeJSON } = require("./_components/utils");

async function insert2db(data) {
    let date = String(data["date"]), place = String(data["place"]),
        contact = String(data["contact"]), reason = String(data["reason"]);
    const timestamp = Date.now();
    const wishid = rndID(24, timestamp);
    await sql.run(`INSERT INTO wishes (wishid, date, place, contact, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?)`,
        [wishid, date, place, contact, reason, timestamp]).catch(e => { throw e });
    return { wishid, date, place, contact, reason, timestamp }
}

router.post("/submit", async (ctx) => {
    if (ctx.header["content-type"] !== "application/json")
        return ctx.body = {
            status: "error",
            msg: "Content-Type must be application/json"
        }

    const jsonText = ctx.request.rawBody || "{}"
    try {
        const data = JSON.parse(jsonText);

        if (typeof data["contact"] !== "string" || typeof data["reason"] !== "string")
            return ctx.body = {
                status: "error",
                msg: "Invalid parameter"
            }
        if (data["contact"].length <= 0 || data["reason"].length <= 0)
            return ctx.body = {
                status: "error",
                msg: "Parameters contact and reason cannot be empty"
            }

        const DEFAULT = {
            date: "unknown",
            place: "unknown"
        }
        const result = await insert2db(mergeJSON(DEFAULT, data));
        ctx.body = {
            status: "success",
            data: result
        };
    } catch (e) {
        console.error(e);
        ctx.body = {
            status: "error",
            msg: "Internal Server Error"
        }
    }
})

module.exports = router;