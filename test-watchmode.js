const RAPID_API_KEY = 'fdd47c2553mshd19015530c43e2cp1a9d7djsn31c6ad035190';

async function testWatchmode() {
    const query = 'Home Alone 3';
    console.log(`Testing Watchmode API for: ${query}`);

    // Step 1: Search for the title to get the Watchmode ID
    const searchUrl = `https://watchmode.p.rapidapi.com/search/?search_field=name&search_value=${encodeURIComponent(query)}&types=movie`;

    const options = {
        method: 'GET',
        headers: {
            'x-rapidapi-key': RAPID_API_KEY,
            'x-rapidapi-host': 'watchmode.p.rapidapi.com'
        }
    };

    try {
        const searchRes = await fetch(searchUrl, options);
        if (searchRes.status !== 200) {
            console.log(`Search failed with status: ${searchRes.status}`);
            const err = await searchRes.text();
            console.log("Error:", err);
            return;
        }

        const searchData = await searchRes.json();
        const results = searchData.title_results || [];

        if (results.length > 0) {
            const first = results[0];
            console.log(`Found Title: ${first.name} (ID: ${first.id})`);

            // Step 2: Get details/sources for this ID specifically for KR region
            // Note: Watchmode often requires 'regions=KR' parameter
            const detailUrl = `https://watchmode.p.rapidapi.com/title/${first.id}/sources/?regions=KR`;
            const detailRes = await fetch(detailUrl, options);

            if (detailRes.status === 200) {
                const sources = await detailRes.json();
                console.log("Sources for KR region:");
                if (sources && sources.length > 0) {
                    sources.forEach(s => {
                        console.log(`- Provider: ${s.name} (${s.type}) | Price: ${s.price || 'N/A'} ${s.currency || ''} | Link: ${s.web_url}`);
                    });
                } else {
                    console.log("No sources found for KR region.");
                }
            } else {
                console.log(`Details failed with status: ${detailRes.status}`);
            }
        } else {
            console.log("No results found in search.");
        }
    } catch (e) {
        console.error("Test Error:", e);
    }
}

testWatchmode();
