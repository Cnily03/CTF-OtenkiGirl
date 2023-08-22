const Base58 = require("base-58");

function copyJSON(obj) {
    if (typeof obj !== "object" || obj === null) {
        if (Array.isArray(obj)) return Array.from(obj);
        else return obj;
    }

    const copy = Array.isArray(obj) ? [] : {};

    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            Object.defineProperty(copy, key, {
                value: copyJSON(obj[key]),
                enumerable: true,
                writable: true,
                configurable: true
            });
        }
    }

    return copy;
}

const mergeJSON = function (target, patch, deep = false) {
    if (typeof patch !== "object") return patch;
    if (Array.isArray(patch)) return patch; // do not recurse into arrays
    if (!target) target = {}
    if (deep) { target = copyJSON(target), patch = copyJSON(patch); }
    for (let key in patch) {
        if (key === "__proto__") continue;
        if (target[key] !== patch[key])
            target[key] = mergeJSON(target[key], patch[key]);
    }
    return target;
}

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

const DEFAULT_CREATE_DATE_OPTIONS = {
    UTC: false,
    format: [
        "yyyy-MM-dd HH:mm:ss",
        "yyyy-MM-dd HH:mm:ss.fff",
        "yyyy-MM-dd",
        "MM-dd-yyyy",
        "MM-dd-yyyy HH:mm:ss",
        "MM-dd-yyyy HH:mm:ss.fff",
        "MM/dd/yy HH:mm:ss",
        "HH:mm:ss",
        "HH:mm:ss.fff"
    ],
    // baseDate: undefined
}

/**
 * Creates a Date object from a string or number.
 * @param {string|number} str - The string or number to create the Date object from.
 * @param {Object} [opts] - An optional object containing options for creating the Date object. If a boolean is provided, it will be treated as the `UTC` option.
 * @param {boolean} [opts.UTC=false] - Whether to create the Date object in UTC time.
 * @param {string|string[]} [opts.format] - The format(s) of the input string. If not provided, the function will attempt to automatically detect the format.
 * @param {Date} [opts.baseDate] - The base date to use when parsing relative dates. Defaults to the current date.
 * @returns {Date} A Date object.
 */
const createDate = (str, opts) => {
    if (typeof opts === "undefined") opts = DEFAULT_CREATE_DATE_OPTIONS
    if (typeof opts !== "object") opts = { ...DEFAULT_CREATE_DATE_OPTIONS, UTC: Boolean(opts) };
    opts.UTC = typeof opts.UTC === "undefined" ? DEFAULT_CREATE_DATE_OPTIONS.UTC : Boolean(opts.UTC);
    opts.format = opts.format || DEFAULT_CREATE_DATE_OPTIONS.format;
    if (!Array.isArray(opts.format)) opts.format = [opts.format]
    opts.format = opts.format.filter(f => typeof f === "string")
        .filter(f => {
            if (/yy|yyyy|MM|dd|HH|mm|ss|fff/.test(f) === false) {
                console.warn(`Invalid format "${f}".`, `At least one format specifier is required.`);
                return false;
            }
            if (`|${f}|`.replace(/yyyy/g, "yy").split(/yy|MM|dd|HH|mm|ss|fff/).includes("")) {
                console.warn(`Invalid format "${f}".`, `Delimeters are required between format specifiers.`);
                return false;
            }
            if (f.includes("yyyy") && f.replace(/yyyy/g, "").includes("yy")) {
                console.warn(`Invalid format "${f}".`, `"yyyy" and "yy" cannot be used together.`);
                return false;
            }
            return true;
        })
    opts.baseDate = new Date(opts.baseDate || Date.now());

    // number
    if (typeof str === "number") {
        return new Date(str);
    } else if (typeof str === "string") {
        // number string
        if (/^\-?\d+$/.test(str.trim())) return createDate(Number(str.trim()));

        // utility functions
        const isLeapYear = year => (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0)
        const MonthDay = (mon, year) => [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mon - 1]
        const pad = (n, len) => String(n).padStart(len, "0")
        const getYMD = (date) => {
            let regres = /^(\d+) *(\-|\/) *(\d+) *(\-|\/) *(\d+)$/.exec(date.trim())
            if (regres === null) return {}
            const [n1, n2, n3] = [regres[1], regres[3], regres[5]].map(Number);
            if (1 <= n2 && n2 <= 12 && 1 <= n3 && n3 <= MonthDay(n2, n1)) {
                // 2020-12-31
                let yyyy = pad(n1, 4), MM = pad(n2, 2), dd = pad(n3, 2);
                return { yyyy, MM, dd }
            } else if (1 <= n1 && n1 <= 12 && 1 <= n2 && n2 <= MonthDay(n1, n3)) {
                // 12-31-2020
                let yyyy = pad(n3, 4), MM = pad(n1, 2), dd = pad(n2, 2);
                return { yyyy, MM, dd }
            } else return {}
        }
        const getHMS = (time) => {
            let regres = /^(\d+) *\: *(\d+)( *\: *(\d+)( *\. *(\d+))?)?$/.exec(time.trim())
            if (regres === null) return {}
            let [n1, n2, n3, n4] = [regres[1], regres[2], regres[4], regres[6]].map(t => typeof t === "undefined" ? undefined : Number(t));
            if (typeof n3 === "undefined") n3 = 0; // 23:59(:59)?
            if (0 <= n1 && n1 <= 23 && 0 <= n2 && n2 <= 59 && 0 <= n3 && n3 <= 59) {
                // 23:59:59(.999)?
                let HH = pad(n1, 2), mm = pad(n2, 2), ss = pad(n3, 2),
                    fff = typeof n4 === "undefined" ? undefined : pad(n4, 3).substring(0, 3);
                const o = { HH, mm, ss }
                if (typeof fff !== "undefined") o.fff = fff;
                return o;
            } else return {}
        }
        const escapeRegExp = (str) => str.replace(/[.*+?^${}()|\[\]\\]/g, '\\$&'); // $& means the whole matched string

        // format
        if (Array.isArray(opts.format) && opts.format.length > 0) {
            for (let fmt of opts.format) {
                let sortTable = ["yy", "yyyy", "MM", "dd", "HH", "mm", "ss", "fff"].filter(f => fmt.includes(f))
                    .sort((a, b) => fmt.indexOf(a) - fmt.indexOf(b))
                const regExpr = escapeRegExp(fmt)
                    .replace(/yyyy/, "(\\d+)").replace(/yy/, "(\\d+)")
                    .replace(/MM/, "(\\d+)").replace(/dd/, "(\\d+)")
                    .replace(/HH/, "(\\d+)").replace(/mm/, "(\\d+)").replace(/ss/, "(\\d+)")
                    .replace(/fff/, "(\\d+)")
                let regres = new RegExp(`^${regExpr}$`).exec(str.trim())
                if (regres === null) continue
                const dateObj = opts.baseDate
                const _UTC = opts.UTC ? "UTC" : ""
                let argTable = {
                    "yyyy": dateObj[`get${_UTC}FullYear`](),
                    "MM": dateObj[`get${_UTC}Month`]() + 1,
                    "dd": dateObj[`get${_UTC}Date`](),
                    "HH": dateObj[`get${_UTC}Hours`](),
                    "mm": dateObj[`get${_UTC}Minutes`](),
                    "ss": dateObj[`get${_UTC}Seconds`](),
                    "fff": dateObj[`get${_UTC}Milliseconds`] ? dateObj[`get${_UTC}Milliseconds`]() : undefined // due to system architecture
                }
                sortTable.forEach((f, i) => {
                    if (f == "yy") {
                        let year = Number(regres[i + 1])
                        year = year < 100 ? (1900 + year) : year;
                        return argTable["yyyy"] = year;
                    }
                    argTable[f] = Number(regres[i + 1])
                })
                let { yyyy, MM, dd, HH, mm, ss, fff } = argTable;

                [yyyy, MM, dd, HH, mm, ss, fff] = [pad(yyyy, 4), pad(MM, 2), pad(dd, 2), pad(HH, 2), pad(mm, 2), pad(ss, 2), typeof fff === "undefined" ? undefined : pad(fff, 3)];
                const d = new Date(`${yyyy}-${MM}-${dd}T${HH}:${mm}:${ss}` + (typeof fff === "number" ? `.${fff}` : "") + (opts.UTC ? "Z" : ""));

                if (Number.isSafeInteger(d.getTime())) return d;
                else continue;
            }
        }

        // Following: fallback to automatic detection
        // date or date time
        let date_time, delimiter = " ";
        if (str.includes("T")) { // T
            let delimiter_pos = str.indexOf("T");
            delimiter = "T";
            date_time = [str.substring(0, delimiter_pos), str.substring(delimiter_pos + 1)];
        } else { // space
            let subdeli_pos1 = str.indexOf(":");
            let subdeli_pos2 = str.indexOf("-");
            if (subdeli_pos2 === -1) subdeli_pos2 = str.indexOf("/");
            if (subdeli_pos1 === -1 || subdeli_pos2 === -1) date_time = [str];
            else {
                let subdeli_pos = Math.max(subdeli_pos1, subdeli_pos2);
                let meetNumber = false;
                while (--subdeli_pos) {
                    if (/\d/.test(str[subdeli_pos])) meetNumber = true;
                    if (meetNumber && str[subdeli_pos].trim() === "") {
                        delimiter = str[subdeli_pos];
                        date_time = [str.substring(0, subdeli_pos), str.substring(subdeli_pos)];
                        break;
                    }
                }
                if (!meetNumber) date_time = [str];
            }
        }

        if (date_time.length === 1) { // only date
            const { yyyy, MM, dd } = getYMD(date_time[0])
            if (typeof yyyy === "string" && typeof MM === "string" && typeof dd === "string") {
                return new Date(`${yyyy}-${MM}-${dd}T00:00:00` + (opts.UTC ? "Z" : ""));
            } else return new Date("Invalid Date");
        } else { // date and time
            const s1 = date_time[0].trim(), s2 = date_time[1].trim();
            let date_str, time_str, UTC = opts.UTC;
            if (delimiter === "T") { // T
                if (/Z$/.test(s1)) return new Date("Invalid Date");
                UTC = /Z$/.test(s2);
                date_str = s1, time_str = s2.slice(-1) === "Z" ? s2.slice(0, -1) : s2;
            } else { // space
                if (/Z$/.test(s1) || /Z$/.test(s2)) return new Date("Invalid Date");
                if (s1.includes(":")) date_str = s2, time_str = s1;
                else date_str = s1, time_str = s2;
            }
            const { yyyy, MM, dd } = getYMD(date_str)
            const { HH, mm, ss, fff } = getHMS(time_str)

            if (typeof yyyy === "string" && typeof MM === "string" && typeof dd === "string" &&
                typeof HH === "string" && typeof mm === "string" && typeof ss === "string") {
                return new Date(`${yyyy}-${MM}-${dd}T${HH}:${mm}:${ss}` + (typeof fff === "string" ? `.${fff}` : "") + (UTC ? "Z" : ""));
            } else return new Date("Invalid Date");
        }
    } else return new Date();
}

module.exports = {
    copyJSON, mergeJSON,
    rndText, rndID,
    createDate
}