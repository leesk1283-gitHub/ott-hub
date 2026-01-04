const TMDB_API_KEY = 'eb11bb474eef7856758589fb09e65c29';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

async function checkProvider(id, type = 'movie') {
    const url = `${TMDB_BASE_URL}/${type}/${id}/watch/providers?api_key=${TMDB_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    console.log(`\n=== Provider data for ${type} ${id} ===`);
    console.log(JSON.stringify(data.results?.KR, null, 2));
}

async function run() {
    await checkProvider(1111873); // Mickey 17
    await checkProvider(671);     // Harry Potter 1
}

run();
