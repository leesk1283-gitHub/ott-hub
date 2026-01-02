const RAPID_API_KEY = 'fdd47c2553mshd19015530c43e2cp1a9d7djsn31c6ad035190';

async function testVariations() {
    const tmdbId = '9714'; // Home Alone 3
    const wmId = '1168156'; // From previous search

    const options = {
        method: 'GET',
        headers: {
            'x-rapidapi-key': RAPID_API_KEY,
            'x-rapidapi-host': 'watchmode.p.rapidapi.com'
        }
    };

    const variations = [
        `https://watchmode.p.rapidapi.com/title/${wmId}/sources/?regions=KR`,
        `https://watchmode.p.rapidapi.com/title/${wmId}/sources/?region=KR`,
        `https://watchmode.p.rapidapi.com/title/movie-${tmdbId}/sources/?regions=KR`,
        `https://watchmode.p.rapidapi.com/title/tmdb-${tmdbId}/sources/?regions=KR`,
        `https://watchmode.p.rapidapi.com/title/${wmId}/details/`
    ];

    for (const url of variations) {
        console.log(`\nTesting: ${url}`);
        try {
            const res = await fetch(url, options);
            console.log(`Status: ${res.status}`);
            if (res.status === 200) {
                const data = await res.json();
                console.log("Success! Data snippet:", JSON.stringify(data).slice(0, 200));
            } else {
                const text = await res.text();
                console.log("Response:", text);
            }
        } catch (e) {
            console.error("Error:", e.message);
        }
    }
}

testVariations();
