const RAPID_API_KEY = 'fdd47c2553mshd19015530c43e2cp1a9d7djsn31c6ad035190';
const RAPID_API_HOST = 'streaming-availability.p.rapidapi.com';

async function fetchLinks(tmdbId, label) {
    const url = `https://${RAPID_API_HOST}/shows/movie/${tmdbId}?country=kr`;
    console.log(`\n--- Checking ${label} (TMDB: ${tmdbId}) ---`);
    try {
        const res = await fetch(url, {
            method: 'GET',
            headers: { 'X-RapidAPI-Key': RAPID_API_KEY, 'X-RapidAPI-Host': RAPID_API_HOST }
        });
        const data = await res.json();
        const kr = data.streamingOptions?.kr;
        if (kr) {
            kr.forEach(opt => {
                if (opt.service.id === 'coupangplay' || opt.service.name?.includes('Coupang')) {
                    console.log(`[Coupang Play] Type: ${opt.type}, Link: ${opt.link}`);
                }
            });
        } else {
            console.log("No KR streaming options found.");
        }
    } catch (e) {
        console.error(`Failed to fetch ${label}:`, e);
    }
}

async function run() {
    await fetchLinks(771, 'Home Alone 1');
    await fetchLinks(772, 'Home Alone 2');
    await fetchLinks(9714, 'Home Alone 3');
}

run();
