// Debug: Check Premium API for non-spaced query
const RAPID_API_KEY = 'fdd47c2553mshd19015530c43e2cp1a9d7djsn31c6ad035190';
const RAPID_API_HOST = 'streaming-availability.p.rapidapi.com';

async function testPremium() {
    const query = '나홀로집에';
    const url = `https://${RAPID_API_HOST}/shows/search/title?title=${encodeURIComponent(query)}&country=kr`;
    console.log(`=== Premium API Search for "${query}" ===`);
    const res = await fetch(url, {
        method: 'GET',
        headers: { 'X-RapidAPI-Key': RAPID_API_KEY, 'X-RapidAPI-Host': RAPID_API_HOST }
    });
    const data = await res.json();
    const shows = Array.isArray(data) ? data : data.result;

    if (shows && shows.length > 0) {
        console.log(`Results: ${shows.length}`);
        shows.slice(0, 3).forEach((show, i) => {
            console.log(`[${i}] ${show.title} (ID: ${show.tmdbId})`);
        });
    } else {
        console.log('No results from Premium API');
    }
}

testPremium();
