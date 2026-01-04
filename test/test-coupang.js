import { searchOTT } from '../src/services/ottService.js';

async function testCoupangFallback() {
    console.log("Testing search for 'Harry Potter'...");
    const results = await searchOTT("Harry Potter");
    const coupangResults = results.filter(r => r.ott === 'Coupang Play');

    console.log(`\nFound ${results.length} total results.`);
    console.log(`Found ${coupangResults.length} Coupang Play results.`);

    if (coupangResults.length > 0) {
        console.log("\nSample Coupang Play result:");
        console.log(JSON.stringify(coupangResults[0], null, 2));
        console.log("\nSUCCESS: Coupang Play fallback is working!");
    } else {
        console.log("\nFAILURE: No Coupang Play results found.");
    }
}

testCoupangFallback();
