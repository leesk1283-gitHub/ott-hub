// Debug: Search for multiple Zootopia results
const TMDB_API_KEY = 'eb11bb474eef7856758589fb09e65c29';

async function searchZootopia() {
    const query = '주토피아';
    const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=ko-KR`);
    const data = await res.json();

    console.log(`=== Results for ${query} ===`);
    data.results?.forEach((m, i) => {
        console.log(`[${i + 1}] ${m.title} (ID: ${m.id}, Date: ${m.release_date})`);
    });
}
searchZootopia();
