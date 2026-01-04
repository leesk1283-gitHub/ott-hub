import { searchOTT } from './src/services/ottService.js';

async function debugSearch() {
    const query = '최악의 악';
    console.log(`Debugging Search for: ${query}`);

    try {
        const results = await searchOTT(query);
        console.log(`Total results found: ${results.length}`);
        results.forEach((r, i) => {
            console.log(`[${i + 1}] ${r.title} | ${r.ott} | ${r.link.substring(0, 40)}...`);
        });

        const disneyResult = results.find(r => r.ott.toLowerCase().includes('disney'));
        if (disneyResult) {
            console.log("SUCCESS: Disney+ result found.");
        } else {
            console.log("FAILURE: Disney+ result MISSING.");
        }
    } catch (e) {
        console.error("Debug failed:", e);
    }
}

debugSearch();
