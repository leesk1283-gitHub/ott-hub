// Debug: Test new failing queries
import { searchOTT } from './src/services/ottService.js';

async function testNewFailures() {
    const queries = ['오페라의유령', '뉴유니버스', '인사이드아웃'];

    for (const query of queries) {
        console.log(`\n=== Testing: "${query}" ===`);
        const results = await searchOTT(query);
        console.log(`Results found: ${results.length}`);
        if (results.length > 0) {
            console.log(`First result: ${results[0].title}`);
        }
    }
}

testNewFailures();
