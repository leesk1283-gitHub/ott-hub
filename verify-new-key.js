const TMDB_API_KEY = 'eb11bb474eef7856758589fb09e65c29';
const BASE_URL = 'https://api.themoviedb.org/3';

async function testKey() {
    const query = '범죄도시';
    console.log(`Verifying key with query: ${query}`);
    try {
        const res = await fetch(`${BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=ko-KR`);
        if (res.status === 200) {
            const data = await res.json();
            console.log(`SUCCESS: Key is valid. Found ${data.results?.length} initial results.`);

            if (data.results && data.results.length > 0) {
                const first = data.results[0];
                console.log(`Checking providers for: ${first.title || first.name} (ID: ${first.id})`);
                const pRes = await fetch(`${BASE_URL}/${first.media_type === 'movie' ? 'movie' : 'tv'}/${first.id}/watch/providers?api_key=${TMDB_API_KEY}`);
                const pData = await pRes.json();
                console.log(`KR Providers:`, !!pData.results?.KR);
            }
        } else {
            console.log(`FAILURE: Status ${res.status}`);
        }
    } catch (e) {
        console.log(`ERROR: ${e.message}`);
    }
}

testKey();
