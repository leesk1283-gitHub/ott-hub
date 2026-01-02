// Debug: Check raw API response for Attack on Titan (TMDB ID: 1429)
const RAPID_API_KEY = 'fdd47c2553mshd19015530c43e2cp1a9d7djsn31c6ad035190';
const RAPID_API_HOST = 'streaming-availability.p.rapidapi.com';

async function checkAOTApiResponse() {
    const tmdbId = 1429; // Attack on Titan TV series
    const url = `https://${RAPID_API_HOST}/shows/tv/${tmdbId}?country=kr`;

    console.log(`Fetching: ${url}`);

    try {
        const res = await fetch(url, {
            method: 'GET',
            headers: { 'X-RapidAPI-Key': RAPID_API_KEY, 'X-RapidAPI-Host': RAPID_API_HOST }
        });

        if (res.status === 200) {
            const data = await res.json();
            console.log('\n=== Title Info ===');
            console.log('Title:', data.title);
            console.log('Original Title:', data.originalTitle);

            console.log('\n=== Korean Streaming Options ===');
            if (data.streamingOptions?.kr) {
                data.streamingOptions.kr.forEach((opt, idx) => {
                    console.log(`\n[${idx + 1}] ${opt.service?.name || opt.service?.id}`);
                    console.log('  Type:', opt.type);
                    console.log('  Price:', opt.price ? `${opt.price.amount} ${opt.price.currency}` : 'N/A');
                    console.log('  Link:', opt.link);
                });
            } else {
                console.log('No Korean streaming options found in API response.');
            }
        } else {
            console.log('API returned status:', res.status);
            const text = await res.text();
            console.log('Response:', text);
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

checkAOTApiResponse();
