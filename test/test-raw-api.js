const RAPID_API_KEY = 'fdd47c2553mshd19015530c43e2cp1a9d7djsn31c6ad035190';
const RAPID_API_HOST = 'streaming-availability.p.rapidapi.com';

async function testRawStreamingAvailability() {
    const query = 'Home Alone 3';
    console.log(`Testing Streaming Availability API for: ${query}`);

    const url = `https://${RAPID_API_HOST}/shows/search/title?title=${encodeURIComponent(query)}&country=kr`;

    const options = {
        method: 'GET',
        headers: {
            'x-rapidapi-key': RAPID_API_KEY,
            'x-rapidapi-host': RAPID_API_HOST
        }
    };

    try {
        const res = await fetch(url, options);
        console.log(`Status: ${res.status}`);
        if (res.status === 200) {
            const data = await res.json();
            const results = data.result || [];
            console.log(`Found ${results.length} results.`);

            results.forEach((show, idx) => {
                console.log(`\n[${idx}] Title: ${show.title}`);
                const kr = show.streamingOptions?.kr || [];
                if (kr.length > 0) {
                    kr.forEach(opt => {
                        console.log(` - Service: ${opt.service.name} (${opt.service.id}) | Type: ${opt.type} | Price: ${opt.price ? opt.price.amount + opt.price.currency : 'N/A'}`);
                    });
                } else {
                    console.log(" - No KR streaming options found.");
                }
            });
        } else {
            const text = await res.text();
            console.log("Response:", text);
        }
    } catch (e) {
        console.error("Test Error:", e);
    }
}

testRawStreamingAvailability();
