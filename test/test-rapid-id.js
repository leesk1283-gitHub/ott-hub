const RAPID_API_KEY = 'fdd47c2553mshd19015530c43e2cp1a9d7djsn31c6ad035190';
const RAPID_API_HOST = 'streaming-availability.p.rapidapi.com';

async function testRapidId(tmdbId, country = 'kr') {
    const type = 'movie';
    console.log(`Testing RapidAPI ID Lookup for: ${tmdbId} (${type}) in ${country}`);

    const url = `https://${RAPID_API_HOST}/shows/${type}/${tmdbId}?country=${country}`;

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
            const opts = data.streamingOptions?.[country] || [];
            if (opts.length > 0) {
                opts.forEach(opt => {
                    console.log(` - Service: ${opt.service.name} | Type: ${opt.type} | Price: ${opt.price ? JSON.stringify(opt.price) : 'N/A'}`);
                });
            } else {
                console.log(` - No ${country} streaming options found.`);
            }
        } else {
            console.log("Error status:", res.status);
        }
    } catch (e) {
        console.error("Test Error:", e);
    }
}

const args = process.argv.slice(2);
const id = args[0] || '771';
const co = args[1] || 'kr';
testRapidId(id, co);
