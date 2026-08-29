// Debug: Check Premium API for Zootopia (269149)
const RAPID_API_KEY = process.env.RAPID_API_KEY;
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
