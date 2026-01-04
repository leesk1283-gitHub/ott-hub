import { searchOTT } from './src/services/ottService.js';

async function test() {
    console.log("Searching for '나홀로집에' (no spaces)...");
    const results = await searchOTT('나홀로집에');
    results.forEach((r, idx) => {
        if (r.ott === 'Coupang Play') {
            console.log(`[${idx + 1}] Title: ${r.title}, Link: ${r.link}, ID: ${r.id}`);
        }
    });
}

test();
