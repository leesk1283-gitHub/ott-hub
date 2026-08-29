// Debug: Check OTT for Zootopia (269149)
const TMDB_API_KEY = process.env.TMDB_API_KEY;

async function checkZootopiaActual() {
    const id = 269149;
    const url = `https://api.themoviedb.org/3/movie/${id}/watch/providers?api_key=${TMDB_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    console.log(JSON.stringify(data.results?.KR, null, 2));
}
checkZootopiaActual();
