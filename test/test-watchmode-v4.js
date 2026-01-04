const WATCHMODE_API_KEY = 'jXcL2jjDQqdC1VUFZio0a5UNYzC0YLIw8zGLyHmz';

async function testFinal() {
    console.log("Testing Watchmode Key validity...");

    // Test 1: Simple Search (to check if key works at all)
    const searchUrl = `https://api.watchmode.com/v1/search/?apiKey=${WATCHMODE_API_KEY}&search_field=name&search_value=Home+Alone+3&types=movie`;

    try {
        const res = await fetch(searchUrl);
        console.log(`Search Status: ${res.status}`);
        const data = await res.json();

        if (res.status === 200) {
            const firstId = data.title_results?.[0]?.id;
            console.log(`Key is valid. Found ID: ${firstId}`);

            if (firstId) {
                // Test 2: Sources for KR
                const sourceUrl = `https://api.watchmode.com/v1/title/${firstId}/sources/?apiKey=${WATCHMODE_API_KEY}&regions=KR`;
                const sRes = await fetch(sourceUrl);
                console.log(`KR Source Status: ${sRes.status}`);
                const sData = await sRes.json();
                console.log("KR Response Body:", JSON.stringify(sData));
            }
        } else {
            console.log("Search failed:", JSON.stringify(data));
        }
    } catch (e) {
        console.error("Fetch Error:", e.message);
    }
}

testFinal();
