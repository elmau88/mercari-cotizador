import axios from "axios";

const url = "https://jp.mercari.com/en/item/m75873395876";
const headers = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" };
const res = await axios.get(url, { headers, timeout: 10000 });
const content = res.data;

const ogTitle = content.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/);
const twitterTitle = content.match(/<meta[^>]*name="twitter:title"[^>]*content="([^"]+)"/);
const title = content.match(/<title>([^<]+)<\/title>/);

console.log("Meta tags encontrados:\n");
if (ogTitle) console.log("og:title:", ogTitle[1]);
if (twitterTitle) console.log("twitter:title:", twitterTitle[1]);
if (title) console.log("title:", title[1]);
