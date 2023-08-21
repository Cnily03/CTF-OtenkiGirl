const SQL = require("./routes/sql");

// creating database wishes
const sql = new SQL("wishes")

sql.then(_ => {
    // creating table wishes (id, wishid, date, place, contact, reason, timestamp)
    sql.run(`CREATE TABLE IF NOT EXISTS wishes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wishid TEXT UNIQUE,
        date TEXT,
        place TEXT,
        contact TEXT,
        reason TEXT,
        timestamp INTEGER
    )`)
})