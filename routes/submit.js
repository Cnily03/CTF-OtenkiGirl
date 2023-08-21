const Router = require("koa-router");
const router = new Router();
const SQL = require("./sql");
const sql = new SQL("wishes");
const Base58 = require("base-58");

const ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const rndText = (length) => {
    return Array.from({ length }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');
}

const timeText = (timestamp) => {
    timestamp = (typeof timestamp === "number" ? timestamp : Date.now()).toString();
    let text1 = timestamp.substring(0, timestamp.length / 2);
    let text2 = timestamp.substring(timestamp.length / 2)
    let text = "";
    for (let i = 0; i < text1.length; i++)
        text += text1[i] + text2[text2.length - 1 - i];
    if (text2.length > text1.length) text += text2[0];
    return Base58.encode(rndText(3) + Buffer.from(text)); // length = 20
}

const rndID = (length, timestamp) => {
    const t = timeText(timestamp);
    if (length < t.length) return t.substring(0, length);
    else return t + rndText(length - t.length);
}

async function insert2db(data) {
    let date = String(data["date"]), place = String(data["place"]),
        contact = String(data["contact"]), reason = String(data["reason"]);
    const timestamp = Date.now();
    const wishid = rndID(24, timestamp);
    await sql.run(`INSERT INTO wishes (wishid, date, place, contact, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?)`,
        [wishid, date, place, contact, reason, timestamp]).catch(e => { throw e });
    return { wishid, date, place, contact, reason, timestamp }
}

const merge = (dst, src) => {
    if (typeof dst !== "object" || typeof src !== "object") return dst;
    for (let key in src) {
        if (key in dst && key in src) {
            dst[key] = merge(dst[key], src[key]);
        } else {
            dst[key] = src[key];
        }
    }
    return dst;
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
        const result = await insert2db(merge(DEFAULT, data));
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