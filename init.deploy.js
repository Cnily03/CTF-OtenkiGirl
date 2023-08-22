const fs = require("fs");
const path = require("path");
const { rndID } = require("./routes/_components/utils");
const SQL = require("./routes/sql");

const rndMs = () => Math.floor(Math.random() * 1000).toString().padStart(3, "0");

// if exists, delete database
const dbPath = path.resolve("sql", "wishes.db");
if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
}

// creating database wishes
const sql = new SQL("wishes")

const flag = process.env.FLAG || "flag{test_flag}"

const initialData = [
    {
        "date": "2021-08-11",
        "place": "神宫外苑",
        "contact": "つきつき",
        "reason": "地元の花火大会！大学生の男です！！はずかしながら、年齢=彼女いない歴なのですが、ついに！！勇気をぶり絞り、片思い中の女性を念願のデー",
        "timestamp": new Date("2013-08-02 20:16:38." + rndMs()).getTime()
    },
    {
        "date": "2021-08-12",
        "place": "東京湾に面した江東区立若洲公園",
        "contact": "kid",
        "reason": "BBQ楽しくやりたい。必ず晴れにできるとかマジリスペクト、噂がホントならお願いしたい、ずっと友達と計画してたBBQがしたいので晴れにして",
        "timestamp": new Date("2013-08-01 12:31:01." + rndMs()).getTime()
    },
    {
        "date": "2021-08-15",
        "place": "横浜アリーナ",
        "contact": "KEI",
        "reason": "野外ライプは晴れてなきゃ🎶晴れ女さんはじめまして！インディーズバンドのギタ担当、KEIと言います✨次の日曜日は初🌟野外ライプイベントがあるんです！！！",
        "timestamp": new Date("2013-08-03 09:32:26." + rndMs()).getTime()
    },
    {
        "date": "2021-08-12",
        "place": "立花の住居",
        "contact": "立花",
        "reason": "夫の初盆なのです。",
        "timestamp": new Date("2013-08-05 11:13:56." + rndMs()).getTime()
    },
    {
        "date": "2021-08-12",
        "place": "東京タワー",
        "contact": "妻LOVE",
        "reason": "最愛の妻との結婚記念日",
        "timestamp": new Date("2013-08-05 11:13:49." + rndMs()).getTime()
    },
    {
        "date": "2021-09-27",
        "place": "学園都市",
        "contact": "御坂美琴",
        "reason": `海胆のような顔をしたあいつが大覇星祭で私に負けた、彼を連れて出かけるつもりだ。彼を携帯店のカップルのイベントに連れて行きたい（イベントでプレゼントされるゲコ太は超レアだ！）晴れの日が必要で、彼を完全にやっつける！ゲコ太の抽選番号は${flag}です`,
        "timestamp": new Date("2007-09-25 13:14:00." + rndMs()).getTime()
    }
]

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
    )`).then(_ => {
        Promise.all(initialData.map(insert))
    })
})

async function insert(data) {
    let date = String(data["date"]), place = String(data["place"]),
        contact = String(data["contact"]), reason = String(data["reason"]);
    const timestamp = data.timestamp;
    const wishid = rndID(24, timestamp);
    await sql.run(`INSERT INTO wishes (wishid, date, place, contact, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?)`,
        [wishid, date, place, contact, reason, timestamp]).catch(e => { throw e });
}