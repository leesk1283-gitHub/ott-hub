const TMDB_API_KEY = 'eb11bb474eef7856758589fb09e65c29';
const BASE_URL = 'https://api.themoviedb.org/3';

async function investigate() {
    // 1. Check exact price data for a known paid movie (e.g., Roundup 4)
    console.log("--- Checking Price Availability for Roundup 4 (ID: 1010600) ---");
    const pRes = await fetch(`${BASE_URL}/movie/1010600/watch/providers?api_key=${TMDB_API_KEY}`);
    const pData = await pRes.json();
    console.log("Roundup 4 KR Providers:", JSON.stringify(pData.results?.KR, null, 2));

    // 2. Check Home Alone sequels search
    console.log("\n--- Checking Home Alone Sequels Search ---");
    const sRes = await fetch(`${BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent('나홀로 집에')}&language=ko-KR`);
    const sData = await sRes.json();
    console.log("Search Results Titles:", sData.results?.map(r => r.title || r.name));

    const sequels = [
        { name: '나홀로 집에 2', id: 772 },
        { name: '나홀로 집에 3', id: 9870 }
    ];

    for (const sq of sequels) {
        console.log(`\n--- Checking Watch Providers for ${sq.name} (ID: ${sq.id}) ---`);
        const wpRes = await fetch(`${BASE_URL}/movie/${sq.id}/watch/providers?api_key=${TMDB_API_KEY}`);
        const wpData = await wpRes.json();
        const kr = wpData.results?.KR;
        if (kr) {
            console.log(`${sq.name} KR Providers:`, JSON.stringify(kr, null, 2));
        } else {
            console.log(`${sq.name}: NO KR PROVIDERS FOUND IN TMDB DATA`);
        }
    }
}

investigate();
