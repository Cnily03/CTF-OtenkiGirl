const SQLite = require("sqlite3");
const path = require("path");
const fs = require("fs");

class SQL {
    constructor(dbname) {
        const dbpath = path.resolve(path.resolve("sql"), dbname + ".db")
        if (!fs.existsSync(dbpath)) {
            fs.writeFileSync(dbpath, "")
        }
        this.dbname = dbname
        this.dbpath = dbpath
        this._live = false
        this._db = this.db
    }
    static pool = {}
    get db() {
        const dbkey = `[${this.dbname}]`
        if (!Object.hasOwnProperty.call(SQL.pool, dbkey))
            SQL.pool[dbkey] = this.getDB()
        return SQL.pool[dbkey]
    }
    set db(v) {
        this._db = SQL.pool[`[${this.dbname}]`] = v
    }
    getDB() {
        return new SQLite.Database(this.dbpath, (err) => {
            if (err) console.error(err)
            this._live = true
        })
    }
    async get(sql, params) {
        return await new Promise((resolve, reject) => {
            this.db.get(sql, params, function (err, row) {
                if (err) reject(err)
                resolve(row)
            })
        })
    }
    async all(sql, params) {
        return await new Promise((resolve, reject) => {
            this.db.all(sql, params, function (err, rows) {
                if (err) reject(err)
                resolve(rows)
            })
        })
    }
    async run(sql, params) {
        return await new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) reject(err)
                resolve(this)
            })
        })
    }
    async each(sql, params) {
        return await new Promise((resolve, reject) => {
            this.db.each(sql, params, function (err, row) {
                if (err) reject(err)
                resolve(row)
            })
        })
    }
    then(cb) {
        return new Promise((resolve, reject) => {
            let itvid = setInterval(() => {
                if (this._live) {
                    resolve(cb())
                    clearInterval(itvid)
                }
            }, 10)
        })
    }
}

module.exports = SQL