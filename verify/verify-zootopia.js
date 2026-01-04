// Debug: Check Zootopia with patch (ESM)
import { searchOTT } from './src/services/ottService.js';

async function verifyZootopia() {
    console.log('=== Verifying Zootopia ===');
    const results = await searchOTT('주토피아');
    results.forEach(r => {
        if (r.title === '주토피아') {
            console.log(`[${r.ott}] ${r.priceText} | ${r.link.slice(0, 50)}...`);
        }
    });
}
verifyZootopia();
