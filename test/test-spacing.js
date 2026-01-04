// Debug: Compare search for spaced and non-spaced query
import { searchOTT } from './src/services/ottService.js';

async function testSpacing() {
    const query1 = '나홀로 집에';
    const query2 = '나홀로집에';

    console.log(`=== Testing: "${query1}" ===`);
    const res1 = await searchOTT(query1);
    console.log(`Results: ${res1.length}`);
    if (res1.length > 0) {
        console.log(`First result: ${res1[0].title} (${res1[0].ott})`);
    }

    console.log(`\n=== Testing: "${query2}" ===`);
    const res2 = await searchOTT(query2);
    console.log(`Results: ${res2.length}`);
    if (res2.length > 0) {
        console.log(`First result: ${res2[0].title} (${res2[0].ott})`);
    }
}

testSpacing();
