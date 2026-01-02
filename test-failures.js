// Debug: Test why specific non-spaced queries fail
import { searchOTT } from './src/services/ottService.js';

async function testFailures() {
    const queries = ['데드풀과울버린', '진격의거인'];

    for (const query of queries) {
        console.log(`\n=== Testing: "${query}" ===`);
        const results = await searchOTT(query);
        console.log(`Results found: ${results.length}`);
        if (results.length > 0) {
            console.log(`First result: ${results[0].title}`);
        }
    }
}

testFailures();
