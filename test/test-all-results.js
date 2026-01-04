import { searchOTT } from './src/services/ottService.js';

async function test() {
    console.log("Searching for '나 홀로 집에'...");
    const results = await searchOTT('나 홀로 집에');
    results.forEach((r, idx) => {
        console.log(`[${idx + 1}] Title: ${r.title}, OTT: ${r.ott}, Link: ${r.link.substring(0, 50)}...`);
    });
}

test();
