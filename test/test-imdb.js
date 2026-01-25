const RAPID_API_KEY = 'fdd47c2553mshd19015530c43e2cp1a9d7djsn31c6ad035190';
const RAPID_API_HOST = 'streaming-availability.p.rapidapi.com';

async function testImdbId() {
    const imdbId = 'tt0099785'; // Home Alone
    console.log(`Testing RapidAPI IMDb ID Lookup for: ${imdbId}`);

    const url = `https://${RAPID_API_HOST}/shows/${imdbId}?country=kr`;

    const options = {
        method: 'GET',
        headers: {
            'x-rapidapi-key': RAPID_API_KEY,
            'x-rapidapi-host': RAPID_API_HOST
        }
    };

    try {
        const res = await fetch(url, options);
        if (res.status === 200) {
            const data = await res.json();
            console.log(`Title: ${data.title}`);
            const opts = data.streamingOptions?.kr || [];
            if (opts.length > 0) {
                opts.forEach(opt => {
                    console.log(` - Service: ${opt.service.name} | Type: ${opt.type} | Price: ${opt.price ? JSON.stringify(opt.price) : 'N/A'}`);
                });
            } else {
                console.log(" - No KR streaming options found.");
            }
        } else {
            console.log("Error status:", res.status);
        }
    } catch (e) {
        console.error("Test Error:", e);
    }
}

testImdbId();
