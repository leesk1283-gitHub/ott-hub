const TMDB_API_KEY = 'eb11bb474eef7856758589fb09e65c29';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

async function testSearch(query) {
    console.log(`Searching for: "${query}"`);
    const url = `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=ko-KR&page=1`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.results) {
        console.log(`Found ${data.results.length} results.`);
        data.results.forEach(item => {
            const title = item.title || item.name;
            console.log(`- ${title}`);
        });
    } else {
        console.log("No results found.");
    }
}

testSearch('최악');
testSearch('최악의');
