const WATCHMODE_API_KEY = 'jXcL2jjDQqdC1VUFZio0a5UNYzC0YLIw8zGLyHmz';

async function testNewWatchmodeKey() {
    const tmdbId = '9714'; // Home Alone 3
    console.log(`Testing new Watchmode API key for TMDB ID: ${tmdbId}`);

    // Watchmode supports TMDB ID lookup via prefix - testing US region to check key validity
    const url = `https://api.watchmode.com/v1/title/movie-${tmdbId}/sources/?apiKey=${WATCHMODE_API_KEY}&regions=US`;

    try {
        const res = await fetch(url);
        console.log(`Status: ${res.status}`);
        const data = await res.json();

        if (res.status === 200) {
            console.log("Success! Sources for KR region:");
            if (Array.isArray(data) && data.length > 0) {
                data.forEach(s => {
                    console.log(`- Provider: ${s.name} (${s.source_id}) | Type: ${s.type} | Price: ${s.price} | Link: ${s.web_url}`);
                });
            } else {
                console.log("No sources found for KR region.");
            }
        } else {
            console.log("Error Response:", JSON.stringify(data));
        }
    } catch (e) {
        console.error("Test Error:", e.message);
    }
}

testNewWatchmodeKey();
