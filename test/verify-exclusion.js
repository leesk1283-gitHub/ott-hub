import { searchOTT } from '../src/services/ottService.js';

async function verifyExclusion() {
    console.log("=== Verification: Coupang Play Exclusion ===");

    // Testing a known Coupang Play title (Zootopia had a manual patch previously)
    const queries = ["주토피아", "해리 포터", "범죄도시"];

    for (const q of queries) {
        console.log(`\nTesting query: "${q}"`);
        const results = await searchOTT(q);
        const coupangResults = results.filter(r => r.ott === 'Coupang Play');

        console.log(`Total results: ${results.length}`);
        console.log(`Coupang Play results: ${coupangResults.length}`);

        if (coupangResults.length === 0) {
            console.log("✅ Success: No Coupang Play results found.");
        } else {
            console.log("❌ Failure: Coupang Play results still present!");
        }
    }
}

verifyExclusion();
