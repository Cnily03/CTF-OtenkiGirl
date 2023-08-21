import { APP_NAME, LANGUAGES, DEFAULT_LANG, DEFAULT_LANGUAGE } from "../info.mjs";

'use strict';

const ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
export const rndText = (length) => {
    return Array.from({ length }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');
}

/**
 * @returns {HTMLElement}
 */
export const $ = (...s) => document.querySelector(...s);
/**
 * @returns {NodeListOf<HTMLElement>}
 */
export const $all = (...s) => document.querySelectorAll(...s);

export const escapeHtml = (unsafe) => (unsafe || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");