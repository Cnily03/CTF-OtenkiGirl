export class Wishes {
    constructor(storage_key = "wishes") {
        this._storage_key = storage_key;
        let storageText = window.localStorage.getItem(storage_key);
        if (!storageText) {
            this.storage = {};
            window.localStorage.setItem(storage_key, JSON.stringify(this.storage));
            this.newest = 10000;
        } else {
            this.storage = JSON.parse(storageText);
            if (Object.keys(this.storage).length === 0) this.newest = 10000;
            else this.newest = Math.max(...Object.keys(this.storage).map(x => parseInt(this.storage[x].timestamp)));
        }
        this.#_eventPool = {};
        this.#_eventPool["init"] = [];
        this.#_eventPool["get"] = [];
        this.#_eventPool["put"] = [];
        this.#_eventPool["delete"] = [];
        this.#_eventPool["update"] = [];
        this.#_eventPool["push"] = [];
        this.#_eventPool["change"] = [];
    }
    #_eventPool = {};

    get empty() {
        return Object.keys(this.storage).length === 0;
    }

    on(event, cb) {
        if (typeof cb !== "function") return;
        if (!Array.isArray(this.#_eventPool[event])) return;
        this.#_eventPool[event].push(cb);
    }

    off(event, cb) {
        if (typeof cb !== "function") return;
        if (!Array.isArray(this.#_eventPool[event])) return;
        const index = this.#_eventPool[event].indexOf(cb);
        if (index !== -1) this.#_eventPool[event].splice(index, 1);
    }

    #_put(id, data) {
        this.storage[id] = data;
        if (data.timestamp > this.newest) this.newest = data.timestamp;
    }

    #_store() {
        window.localStorage.setItem(this._storage_key, JSON.stringify(this.storage));
    }

    #_update(timestamp) {
        timestamp = (typeof timestamp !== "number" ? this.newest : timestamp) - 10000;
        return new Promise((resolve, reject) => {
            fetch(`info/${timestamp}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }).then(r => r.json()).then(res => {
                if (res.status === "success") {
                    const data = res.data;
                    let newWishes = []
                    for (const id in data) {
                        const wishid = data[id].wishid;
                        if (Object.hasOwnProperty.call(this.storage, wishid)) continue;
                        delete data[id].wishid;
                        this.#_put(wishid, data[id]);
                        newWishes.push(wishid);
                    }
                    this.#_store();
                    resolve(newWishes);
                } else {
                    reject(res.msg);
                }
            })
        })
    }

    #_push(data) {
        return new Promise((resolve, reject) => {
            fetch(`submit`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            }).then(r => r.json()).then(res => {
                if (res.status === "success") {
                    const wishid = res.data.wishid;
                    delete res.data.wishid;
                    this.#_put(wishid, res.data);
                    this.#_store();
                    res.data.wishid = wishid;
                    resolve(res.data);
                } else {
                    reject(res.msg);
                }
            })
        })
    }


    async init() {
        const p = this.#_update();
        p.then(newWishes => {
            this.#_eventPool["init"].every(async cb => cb(this.storage) || 1);
        })
        return p;
    }

    get(id) {
        this.#_eventPool["get"].every(async cb => cb(id, this.storage[id]) || 1);
        return this.storage[id];
    }

    put(id, data) {
        this.#_put(id, data);
        this.#_store();
        this.#_eventPool["put"].every(async cb => cb(id, data) || 1);
    }

    delete(id) {
        const data = this.storage[id];
        delete this.storage[id];
        this.#_store();
        this.#_eventPool["delete"].every(async cb => cb(id, data) || 1);
    }

    async update(timestamp) {
        const p = this.#_update(timestamp);
        p.then(newWishes => {
            this.#_eventPool["update"].every(async cb => cb(newWishes) || 1);
        })
        return p;
    }

    async push(data) {
        const p = this.#_push(data);
        p.then(_data => {
            const wishid = _data.wishid;
            delete _data.wishid;
            this.#_eventPool["push"].every(async cb => cb(wishid, _data) || 1);
        })
        return p;
    }
}