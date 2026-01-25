const TMDB_API_KEY = 'eb11bb474eef7856758589fb09e65c29';

async function searchIds(query) {
    const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=ko-KR`);
    const data = await res.json();
    console.log(`\n=== Results for "${query}" ===`);
    data.results.slice(0, 8).forEach(r => {
        console.log(`- ${r.title} (ID: ${r.id}, Release: ${r.release_date})`);
    });
}

async function run() {
    await searchIds("해리포터");
    await searchIds("미키 17");
}

run();
