const RAPID_API_KEY = process.env.RAPID_API_KEY;
const RAPID_API_HOST = 'streaming-availability.p.rapidapi.com';

async function testFullJson() {
    const tmdbId = '157336';
    const url = `https://${RAPID_API_HOST}/shows/movie/${tmdbId}?country=kr`;
    const res = await fetch(url, { headers: { 'x-rapidapi-key': RAPID_API_KEY, 'x-rapidapi-host': RAPID_API_HOST } });
    const data = await res.json();
    console.log(JSON.stringify(data.streamingOptions.kr, null, 2));
}
testFullJson();
