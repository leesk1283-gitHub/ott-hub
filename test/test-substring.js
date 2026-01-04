// Debug: Test substring "나홀로"
const TMDB_API_KEY = 'eb11bb474eef7856758589fb09e65c29';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

async function testSub() {
    const query = '나홀로';
    const url = `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=ko-KR&page=1`;
    console.log(`=== TMDB Results for "${query}" ===`);
    const res = await fetch(url);
    const data = await res.json();

    if (data.results && data.results.length > 0) {
        console.log(`Results: ${data.results.length}`);
        data.results.slice(0, 5).forEach((item, i) => {
            console.log(`[${i}] ${item.title || item.name} (ID: ${item.id})`);
        });
    } else {
        console.log('No results from TMDB');
    }
}

testSub();
