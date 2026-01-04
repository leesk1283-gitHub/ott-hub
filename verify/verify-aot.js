import { searchOTT } from './src/services/ottService.js';

async function verifyAOT() {
    const query = '진격의 거인';
    console.log(`Verifying results for: ${query}`);

    try {
        const results = await searchOTT(query);
        const aotOriginal = results.filter(r => r.title.includes('진격의 거인'));

        console.log(`Found ${aotOriginal.length} matching results.`);
        aotOriginal.forEach(r => {
            console.log(`[${r.ott}] ${r.title} | ${r.priceText.replace('\n', ' ')} | ${r.link.substring(0, 60)}...`);
        });

        const watcha = aotOriginal.find(r => r.ott === 'Watcha');
        const apple = aotOriginal.find(r => r.ott === 'Apple TV');

        if (watcha && watcha.link.includes('watcha.com/search')) {
            console.log("SUCCESS: Watcha points to search fallback.");
        } else {
            console.log("WAIT: Watcha result missing or using old link.");
        }

        if (apple && apple.link.includes('attack-on-titan')) {
            console.log("SUCCESS: Apple TV points to original series slug.");
        } else {
            console.log("WAIT: Apple TV result missing or using wrong slug.");
        }

    } catch (e) {
        console.error("Verification failed:", e);
    }
}

verifyAOT();
