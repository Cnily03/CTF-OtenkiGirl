import "@css/index.scss"
import "./components/dialog.mjs" // define bunny-dialog
import "./components/service-worker.mjs" // activate service worker
import { APP_NAME, LANGUAGES, DEFAULT_LANG, DEFAULT_LANGUAGE } from "./info.mjs";
import { rndText, $, $all, escapeHtml } from "./components/utils.mjs";
import { Wishes } from "./components/wishes.mjs";

'use strict';

const DOM = {
    PostList: document.getElementById('post_list'),
    Dialog: document.getElementById('dialog'),
    DialogTip: document.getElementById('tips')
}
let curLang = DEFAULT_LANGUAGE;
let wishes = null;


function replaceLanguage(lang, t) {
    curLang = t;

    document.querySelector('html').lang = lang;
    document.title = t.title;
    [...$all('[data-lang]')].forEach((el) => el.innerHTML = t[el.dataset.lang]);
    [...$all('[data-need]')].forEach((el) => el.setAttribute("data-need", t.need));
    [...$all('[data-lang-attrs]')].forEach((el) => {
        const names = el.dataset.langAttrs || "";
        if (!names) return;
        (names).split(",").forEach((n) => el.setAttribute(n, t[el.getAttribute(`data-lang-${n}`)]));
    });
    [...$all('[data-lang-styles]')].forEach((el) => {
        const names = el.dataset.langStyles || "";
        if (!names) return;
        (names).split(",").forEach((n) => el.style.setProperty(`--data-lang-text-${n}`, `'${t[n]}'`));
    });
}

const appLang = () => {
    let htmlLang = document.documentElement.getAttribute('lang');
    const full = (localStorage['og_language'] || navigator.language || DEFAULT_LANG).toLowerCase().substring(0, 5);
    const short = full.substring(0, 2);
    if (LANGUAGES.includes(short)) return short;
    else if (LANGUAGES.includes(full)) return full;
    else return DEFAULT_LANG;
}

window.setLanguage = (lang) => {
    if (lang === curLang) return;
    if (LANGUAGES.includes(lang)) {
        fetch(`lang/${lang}.json`).then(r => r.json()).then(r => {
            localStorage['og_language'] = lang;
            replaceLanguage(lang, r);
        })
    }
}

window.resetLanguage = () => {
    localStorage.removeItem('og_language');
    initLanguage();
}

const initLanguage = () => new Promise(resolve => {
    const lang = appLang();
    if (lang === DEFAULT_LANG) {
        replaceLanguage(lang, DEFAULT_LANGUAGE);
        resolve();
    } else {
        fetch(`lang/${lang}.json`).then(r => r.json()).then(r => {
            replaceLanguage(lang, r);
            resolve();
        }).catch(() => {
            replaceLanguage(DEFAULT_LANG, DEFAULT_LANGUAGE);
            resolve();
        })
    }
});


// create card
const ESCAPE_FIELDS = ["contact", "place", "reason", "date"];
const SHOW_FIELDS = ["place", "time", "reason", "datestamp"];
const createItem = (id, it) => {
    let domid = "wish-" + id;
    let d = document.getElementById(domid);
    if (d) return;
    d = document.createElement('div');
    d.id = domid;
    d.classList.add("card-list-item");
    ESCAPE_FIELDS.forEach(f => it[f] = escapeHtml(it[f]));
    it.time = it.date;
    it.datestamp = (new Date(it.timestamp)).toLocaleDateString();
    let html = `<div class="item-contact"><img alt="avatar" class="avatar" src="img/avatar.jpg"/><div class="item-contact-text">${it.contact}</div></div>`;
    SHOW_FIELDS.forEach(f => html += `<div class="item-field item-${f}">${it[f] || '--'}</div>`);
    d.innerHTML = html;
    DOM.PostList.prepend(d);
    const getLine = s => Math.floor(parseInt(getComputedStyle(d.querySelector(s)).height) / (16 * 1.1))
    d.querySelector('.item-reason').style.setProperty('--line-camp', 6 - getLine('.item-place') - getLine('.item-time'));
};

// load data
function loadContent() {
    wishes = new Wishes("wishes");
    wishes.on("push", (id, it) => createItem(id, it));
    wishes.on("init", (data) => {
        for (let id in data) createItem(id, data[id]);
    });
    wishes.init();
}

const Form = {
    get val() {
        const v = {};
        [...$all('[data-name]')].forEach(x => v[x.dataset.name] = x.value);
        return v;
    },
    reset: () => [...$all('[data-name]')].forEach(x => x.value = ''),
    check: (value, cb = () => { }) => {
        const v = value || Form.val;
        const Tip = (value) => {
            if (!value.contact) return curLang.empty_contact;
            if (!value.reason) return curLang.empty_reason;
        }
        let tip = Tip(v);
        if (tip) {
            DOM.DialogTip.innerHTML = tip;
            DOM.Dialog.cancel = "";
            DOM.Dialog.show();
            return false;
        }
        cb();
        return true;
    }
}



document.getElementById('add_cart').addEventListener('click', _ => {
    const post = Form.val;
    if (!Form.check(post, () => {
        post.timestamp = Date.now();
        DOM.Dialog.cancel = curLang.cancel;
        DOM.DialogTip.innerText = curLang.confirm;
    })) return;

    DOM.Dialog.show(async _ => {
        let _win = true
        await wishes.push(post).catch(_ => {
            DOM.DialogTip.innerHTML = curLang.network_error;
            DOM.Dialog.cancel = "";
            DOM.Dialog.show();
            _win = false;
        });
        if (_win) Form.reset();
    });
});
window.addEventListener("storage", (e) => {
    if (e.key === "og_language") initLanguage().then(_ => loadContent());
});

initLanguage().then(_ => loadContent());
