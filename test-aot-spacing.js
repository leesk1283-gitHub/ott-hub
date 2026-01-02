// Debug: Test non-spaced "진격의거인"
const TMDB_API_KEY = 'eb11bb474eef7856758589fb09e65c29';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

async function testAot() {
    const query = '진격의거인';
    const url = `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=ko-KR&page=1`;
    console.log(`=== TMDB Results for "${query}" ===`);
    const res = await fetch(url);
    const data = await res.json();

    if (data.results && data.results.length > 0) {
        console.log(`Results: ${data.results.length}`);
        console.log(`First result: ${data.results[0].title || data.results[0].name}`);
    } else {
        console.log('No results from TMDB');
    }
}

testAot();
