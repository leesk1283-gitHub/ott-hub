import { searchOTT } from './src/services/ottService.js';

async function verifyFinal() {
    const query = '나 홀로 집에 3';
    console.log(`Verifying: ${query}`);

    try {
        const results = await searchOTT(query);
        const homeAlone3Coupang = results.find(r => r.title.includes('나 홀로 집에 3') && r.ott === 'Coupang Play');

        if (homeAlone3Coupang) {
            console.log("SUCCESS: Home Alone 3 found on Coupang Play");
            console.log(`Price: ${homeAlone3Coupang.priceText}`);
            console.log(`Link: ${homeAlone3Coupang.link}`);

            if (homeAlone3Coupang.price === 5500 && homeAlone3Coupang.link.includes('7611d2a3')) {
                console.log("DATA MATCHED: Price is 5500 and Link is correct.");
            } else {
                console.log("DATA MISMATCH: Check price and link values.");
            }
        } else {
            console.log("FAILED: Home Alone 3 on Coupang Play not found in results.");
        }

        console.log("\nTop 3 Results:");
        results.slice(0, 3).forEach((r, i) => {
            console.log(`${i + 1}. ${r.title} | ${r.ott} | ${r.priceText}`);
        });

    } catch (e) {
        console.error("Verification Error:", e);
    }
}

verifyFinal();
