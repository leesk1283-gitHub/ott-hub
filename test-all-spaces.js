// Debug: Test all space insertions for "뉴유니버스"
const TMDB_API_KEY = 'eb11bb474eef7856758589fb09e65c29';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

async function testAllSpaces() {
    const query = '뉴유니버스';
    console.log(`=== Testing all spaces for "${query}" ===`);

    for (let i = 1; i < query.length; i++) {
        const fq = query.slice(0, i) + ' ' + query.slice(i);
        const url = `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(fq)}&language=ko-KR&page=1`;
        const res = await fetch(url);
        const data = await res.json();
        console.log(`Query: "${fq}" -> Results: ${data.results?.length || 0}`);
        if (data.results && data.results.length > 0) {
            console.log(`First result: ${data.results[0].title || data.results[0].name}`);
        }
    }
}

testAllSpaces();
