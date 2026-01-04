const TMDB_API_KEY = 'eb11bb474eef7856758589fb09e65c29';

async function test() {
    const tmdbId = 771;
    const res = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}/watch/providers?api_key=${TMDB_API_KEY}`);
    const data = await res.json();
    console.log(JSON.stringify(data.results?.KR, null, 2));
}

test();
