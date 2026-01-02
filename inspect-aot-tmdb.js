// Debug: Inspect TMDB multi-search for "진격의 거인"
const TMDB_API_KEY = 'eb11bb474eef7856758589fb09e65c29';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

async function inspectAot() {
    const query = '진격의 거인';
    const url = `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=ko-KR&page=1`;
    const res = await fetch(url);
    const data = await res.json();

    console.log(`=== TMDB Results for "${query}" ===`);
    if (data.results && data.results.length > 0) {
        data.results.forEach((item, i) => {
            console.log(`[${i}] ${item.title || item.name} (ID: ${item.id}, Type: ${item.media_type})`);
        });
    } else {
        console.log('No results found');
    }
}

inspectAot();
