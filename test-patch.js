import { searchOTT } from './src/services/ottService.js';

async function test() {
    console.log("Searching for '나 홀로 집에'...");
    const results = await searchOTT('나 홀로 집에');
    const coupangResults = results.filter(r => r.ott === 'Coupang Play');

    console.log(`Found ${coupangResults.length} Coupang Play results.`);
    coupangResults.forEach(r => {
        console.log(`Title: ${r.title}, Link: ${r.link}, ID: ${r.id}`);
    });
}

test();
