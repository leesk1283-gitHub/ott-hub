import { searchOTT } from './src/services/ottService.js';

async function debugDeepLinks() {
    const queries = ['진격의 거인', '진격의 거인: 홍련의 화살'];

    for (const query of queries) {
        console.log(`\n=== Debugging: ${query} ===`);
        const results = await searchOTT(query);

        results.slice(0, 10).forEach(r => {
            const linkPreview = r.link ? r.link.substring(0, 70) + '...' : 'NO LINK';
            const isTMDB = r.link && r.link.includes('themoviedb.org');
            const isSearch = r.link && r.link.includes('search');
            const status = isTMDB ? '[TMDB FALLBACK]' : (isSearch ? '[SEARCH FALLBACK]' : '[DIRECT LINK]');
            console.log(`${status} ${r.title} | ${r.ott} | ${r.priceText.replace('\n', ' ')} | ${linkPreview}`);
        });
    }
}

debugDeepLinks();
