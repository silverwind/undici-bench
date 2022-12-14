import {readFileSync} from "fs";
import pAll from "p-all";
import nodeFetch from "node-fetch";
import {fetch as undiciFetch} from "undici";
import axios from "axios";

const pkg = JSON.parse(readFileSync(new URL("1500-deps.json", import.meta.url)));
const urls = Object.keys(pkg.devDependencies).map(name => `https://registry.npmjs.org/${name.replace(/\//g, "%2f")}`);
const warmupUrls = urls.slice(0, 10);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const opts = {concurrency: process.argv[2] ? Number(process.argv[2]) : 96};

// warm up the JIT
await Promise.all([
  ...warmupUrls.map(url => nodeFetch(url).then(res => res.text())),
  ...warmupUrls.map(url => axios.get(url, {responseType: "text"})),
  ...warmupUrls.map(url => undiciFetch(url).then(res => res.text())),
]);

await sleep(500);

const t3 = performance.now();
await pAll(urls.map(url => () => axios.get(url, {responseType: "text"})), opts);
console.info(`axios: ${Math.round(performance.now() - t3)}ms`);

await sleep(500);

const t2 = performance.now();
await pAll(urls.map(url => () => nodeFetch(url).then(res => res.text())), opts);
console.info(`node-fetch: ${Math.round(performance.now() - t2)}ms`);

await sleep(500);

const t1 = performance.now();
await pAll(urls.map(url => () => undiciFetch(url).then(res => res.text())), opts);
console.info(`undici: ${Math.round(performance.now() - t1)}ms`);
