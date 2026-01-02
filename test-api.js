const TMDB_API_KEY = '8d9397435444b392230d922572566c82';
const BASE_URL = 'https://api.themoviedb.org/3';

async function test() {
    const query = '오징어 게임';
    console.log(`Searching for: ${query}`);
    const searchRes = await fetch(`${BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=ko-KR`);
    const searchData = await searchRes.json();

    if (!searchData.results || searchData.results.length === 0) {
        console.log('No results found in search/multi');
        return;
    }

    console.log(`Found ${searchData.results.length} results. Checking first 3...`);

    for (const item of searchData.results.slice(0, 3)) {
        console.log(`- ${item.media_type}: ${item.title || item.name} (ID: ${item.id})`);
        if (item.media_type !== 'movie' && item.media_type !== 'tv') continue;

        const type = item.media_type === 'movie' ? 'movie' : 'tv';
        const providerRes = await fetch(`${BASE_URL}/${type}/${item.id}/watch/providers?api_key=${TMDB_API_KEY}`);
        const providerData = await providerRes.json();

        const krProviders = providerData.results?.KR;
        if (krProviders) {
            console.log(`  KR Providers:`, Object.keys(krProviders));
            if (krProviders.flatrate) console.log(`  Flatrate:`, krProviders.flatrate.map(p => p.provider_name));
        } else {
            console.log(`  No KR providers found.`);
        }
    }
}

test();
