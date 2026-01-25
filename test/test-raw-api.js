const RAPID_API_KEY = 'fdd47c2553mshd19015530c43e2cp1a9d7djsn31c6ad035190';
const RAPID_API_HOST = 'streaming-availability.p.rapidapi.com';

async function testRawStreamingAvailability(query, country = 'kr') {
    console.log(`Testing Streaming Availability API for: ${query} in ${country}`);

    const url = `https://${RAPID_API_HOST}/shows/search/title?title=${encodeURIComponent(query)}&country=${country}`;

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
            const results = data.result || [];
            console.log(`Found ${results.length} results.`);

            results.forEach((show, idx) => {
                console.log(`\n[${idx}] Title: ${show.title} (Original: ${show.originalTitle})`);
                const kr = show.streamingOptions?.[country] || [];
                if (kr.length > 0) {
                    kr.forEach(opt => {
                        console.log(` - Service: ${opt.service.name} | Type: ${opt.type} | Price: ${opt.price ? opt.price.amount + opt.price.currency : 'N/A'}`);
                    });
                } else {
                    console.log(` - No ${country} streaming options found.`);
                }
            });
        }
    } catch (e) {
        console.error("Test Error:", e);
    }
}

const q = process.argv[2] || 'Home Alone';
const c = process.argv[3] || 'kr';
testRawStreamingAvailability(q, c);
