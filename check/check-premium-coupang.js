const RAPID_API_KEY = 'fdd47c2553mshd19015530c43e2cp1a9d7djsn31c6ad035190';
const RAPID_API_HOST = 'streaming-availability.p.rapidapi.com';

async function checkPremium(tmdbId, type = 'movie') {
    const url = `https://${RAPID_API_HOST}/shows/${type}/${tmdbId}?country=kr`;
    const res = await fetch(url, {
        method: 'GET',
        headers: { 'X-RapidAPI-Key': RAPID_API_KEY, 'X-RapidAPI-Host': RAPID_API_HOST }
    });
    const data = await res.json();
    console.log(`\n=== Premium API data for ${type} ${tmdbId} ===`);
    if (data.streamingOptions?.kr) {
        data.streamingOptions.kr.forEach(opt => {
            console.log(`- Service: ${opt.service.name}, Type: ${opt.type}`);
        });
    } else {
        console.log("No KR options found");
    }
}

async function run() {
    await checkPremium(671); // Harry Potter 1
}

run();
