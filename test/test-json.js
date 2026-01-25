const RAPID_API_KEY = 'fdd47c2553mshd19015530c43e2cp1a9d7djsn31c6ad035190';
const RAPID_API_HOST = 'streaming-availability.p.rapidapi.com';

async function testFullJson() {
    const tmdbId = '157336';
    const url = `https://${RAPID_API_HOST}/shows/movie/${tmdbId}?country=kr`;
    const res = await fetch(url, { headers: { 'x-rapidapi-key': RAPID_API_KEY, 'x-rapidapi-host': RAPID_API_HOST } });
    const data = await res.json();
    console.log(JSON.stringify(data.streamingOptions.kr, null, 2));
}
testFullJson();
