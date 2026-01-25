const RAPID_API_KEY = 'fdd47c2553mshd19015530c43e2cp1a9d7djsn31c6ad035190';

async function testWatchmode(query) {
    console.log(`\n=== Testing Watchmode API for: ${query} ===`);

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
        const searchData = await searchRes.json();
        const results = searchData.title_results || [];

        if (results.length > 0) {
            const first = results[0];
            console.log(`Found Title: ${first.name} (ID: ${first.id})`);

            const detailUrl = `https://watchmode.p.rapidapi.com/title/${first.id}/sources/?regions=KR`;
            const detailRes = await fetch(detailUrl, options);
            const sources = await detailRes.json();

            console.log("Sources for KR region:");
            if (sources && sources.length > 0) {
                sources.forEach(s => {
                    console.log(`- Provider: ${s.name} (${s.type}) | Link: ${s.web_url}`);
                });
            } else {
                console.log("No sources found for KR region in Watchmode.");
            }
        } else {
            console.log("No results found in search.");
        }
    } catch (e) {
        console.error("Test Error:", e);
    }
}

async function run() {
    await testWatchmode("Harry Potter and the Philosopher's Stone");
    await testWatchmode("Game of Thrones");
}

run();
