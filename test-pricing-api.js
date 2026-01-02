const RAPID_API_KEY = 'fdd47c2553mshd19015530c43e2cp1a9d7djsn31c6ad035190';

async function testPricingApi() {
    const query = 'Home Alone'; // Using English to be safe for now
    console.log(`Testing Streaming Availability API for: ${query}`);

    // Country code 'kr' for South Korea
    const url = `https://streaming-availability.p.rapidapi.com/shows/search/title?title=${encodeURIComponent(query)}&country=kr`;
    const options = {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': RAPID_API_KEY,
            'X-RapidAPI-Host': 'streaming-availability.p.rapidapi.com'
        }
    };

    try {
        const response = await fetch(url, options);
        if (response.status === 200) {
            const result = await response.json();
            console.log("SUCCESS: API result received.");

            if (result && result.length > 0) {
                const first = result[0];
                console.log(`Title Found: ${first.title}`);
                console.log("Streaming Options (KR):");

                const krOptions = first.streamingOptions?.kr;
                if (krOptions) {
                    krOptions.forEach(opt => {
                        const priceInfo = opt.price ? `${opt.price.amount} ${opt.price.currency}` : "Subscription/Free";
                        console.log(`- Service: ${opt.service.id} (${opt.type}) -> Price: ${priceInfo}`);
                    });
                } else {
                    console.log("No 'kr' streaming options found.");
                }
            } else {
                console.log("No results found.");
            }
        } else {
            console.log(`FAILURE: Status ${response.status}`);
            const error = await response.text();
            console.log("Error body:", error);
        }
    } catch (error) {
        console.error("Fetch Error:", error);
    }
}

testPricingApi();
