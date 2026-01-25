import { searchOTT } from '../src/services/ottService.js';

async function verifyAccuracy() {
    console.log("=== Accuracy Test: Squid Game (Should NOT have Coupang Play) ===");
    const squidResults = await searchOTT("Squid Game");
    const squidCoupang = squidResults.filter(r => r.ott === 'Coupang Play');
    console.log(`Squid Game Coupang Results: ${squidCoupang.length}`);
    if (squidCoupang.length === 0) {
        console.log("✅ Success: Squid Game is clean.");
    } else {
        console.log("❌ Failure: Squid Game incorrectly shows Coupang Play.");
    }

    console.log("\n=== Accuracy Test: Harry Potter (Should HAVE Coupang Play) ===");
    const hpResults = await searchOTT("Harry Potter");
    const hpCoupang = hpResults.filter(r => r.ott === 'Coupang Play');
    console.log(`Harry Potter Coupang Results: ${hpCoupang.length}`);
    if (hpCoupang.length > 0) {
        console.log("✅ Success: Harry Potter correctly shows Coupang Play via patch.");
    } else {
        console.log("❌ Failure: Harry Potter missing Coupang Play.");
    }
}

verifyAccuracy();
