const RAPID_API_KEY = 'fdd47c2553mshd19015530c43e2cp1a9d7djsn31c6ad035190';
const RAPID_API_HOST = 'streaming-availability.p.rapidapi.com';

async function testTargeted() {
    const titles = ['최악의 악', 'Home Alone 3', '나 홀로 집에 3'];

    for (const title of titles) {
        console.log(`\n--- Testing API for: ${title} ---`);
        const url = `https://${RAPID_API_HOST}/shows/search/title?title=${encodeURIComponent(title)}&country=kr`;
        const options = {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': RAPID_API_KEY,
                'X-RapidAPI-Host': RAPID_API_HOST
            }
        };

        try {
            const response = await fetch(url, options);
            if (response.status === 200) {
                const result = await response.json();
                const shows = Array.isArray(result) ? result : result.result;
                if (shows && shows.length > 0) {
                    shows.forEach((show, idx) => {
                        console.log(`[${idx}] Title: ${show.title} (Original: ${show.originalTitle})`);
                        const kr = show.streamingOptions?.kr;
                        if (kr) {
                            kr.forEach(opt => {
                                console.log(`  - Service: ${opt.service.name} (${opt.type}) | Price: ${opt.price ? opt.price.amount : 'N/A'} | Link: ${opt.link}`);
                            });
                        }
                    });
                } else {
                    console.log("No results found.");
                }
            } else {
                console.log(`Status: ${response.status}`);
            }
        } catch (e) {
            console.error(e);
        }
    }
}

testTargeted();
