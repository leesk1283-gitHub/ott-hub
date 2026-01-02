// Debug: Check Premium API for Zootopia (269149)
const RAPID_API_KEY = 'fdd47c2553mshd19015530c43e2cp1a9d7djsn31c6ad035190';
const RAPID_API_HOST = 'streaming-availability.p.rapidapi.com';

async function checkPremiumZootopia() {
    const id = 269149;
    const url = `https://${RAPID_API_HOST}/shows/movie/${id}?country=kr`;
    const res = await fetch(url, {
        headers: { 'X-RapidAPI-Key': RAPID_API_KEY, 'X-RapidAPI-Host': RAPID_API_HOST }
    });
    const data = await res.json();
    console.log(JSON.stringify(data.streamingOptions?.kr, null, 2));
}
checkPremiumZootopia();
