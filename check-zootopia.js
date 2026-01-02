// Debug: Check OTT availability for Zootopia
const TMDB_API_KEY = 'eb11bb474eef7856758589fb09e65c29';
const RAPID_API_KEY = 'fdd47c2553mshd19015530c43e2cp1a9d7djsn31c6ad035190';
const RAPID_API_HOST = 'streaming-availability.p.rapidapi.com';

async function checkZootopia() {
    const query = '주토피아';
    console.log(`=== Checking: ${query} ===`);

    // 1. Search TMDB
    const searchRes = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=ko-KR`);
    const searchData = await searchRes.json();
    const movie = searchData.results?.[0];

    if (!movie) {
        console.log('Movie not found on TMDB');
        return;
    }
    console.log(`Found: ${movie.title} (ID: ${movie.id})`);

    // 2. Check Premium API
    try {
        const url = `https://${RAPID_API_HOST}/shows/movie/${movie.id}?country=kr`;
        const res = await fetch(url, {
            headers: { 'X-RapidAPI-Key': RAPID_API_KEY, 'X-RapidAPI-Host': RAPID_API_HOST }
        });
        const data = await res.json();
        const providers = data.streamingOptions?.kr?.map(o => o.service?.name || o.service?.id) || [];
        console.log(`[Premium API] ${providers.join(', ') || 'No KR data'}`);
    } catch (e) {
        console.log(`[Premium API] Error: ${e.message}`);
    }

    // 3. Check TMDB Watch Providers
    try {
        const url = `https://api.themoviedb.org/3/movie/${movie.id}/watch/providers?api_key=${TMDB_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        const kr = data.results?.KR;
        if (kr) {
            const providers = [];
            if (kr.flatrate) providers.push(...kr.flatrate.map(p => p.provider_name + '(구독)'));
            if (kr.buy) providers.push(...kr.buy.map(p => p.provider_name + '(구매)'));
            if (kr.rent) providers.push(...kr.rent.map(p => p.provider_name + '(대여)'));
            console.log(`[TMDB] ${providers.join(', ') || 'No providers'}`);
        } else {
            console.log(`[TMDB] No KR data`);
        }
    } catch (e) {
        console.log(`[TMDB] Error: ${e.message}`);
    }
}

checkZootopia();
