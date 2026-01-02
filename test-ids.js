const RAPID_API_KEY = 'fdd47c2553mshd19015530c43e2cp1a9d7djsn31c6ad035190';
const RAPID_API_HOST = 'streaming-availability.p.rapidapi.com';

async function testByIds() {
    // TMDb IDs
    // Home Alone 1: 771 (movie)
    // Home Alone 2: 772 (movie)
    // Home Alone 3: 9714 (movie)
    // The Worst of Evil: 210191 (tv)

    const items = [
        { id: 'movie/771', name: 'Home Alone 1' },
        { id: 'movie/772', name: 'Home Alone 2' },
        { id: 'movie/9714', name: 'Home Alone 3' },
        { id: 'series/210191', name: 'The Worst of Evil' }
    ];

    for (const item of items) {
        console.log(`\n--- Fetching: ${item.name} (${item.id}) ---`);
        // V4 endpoint for getting a show by ID
        const url = `https://${RAPID_API_HOST}/shows/${item.id}?country=kr`;
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
                const show = await response.json();
                console.log(`Title: ${show.title}`);
                const kr = show.streamingOptions?.kr;
                if (kr) {
                    kr.forEach(opt => {
                        const price = opt.price ? `${opt.price.amount} ${opt.price.currency}` : 'N/A';
                        console.log(`  - ${opt.service.name} (${opt.type}) | Price: ${price} | Link: ${opt.link}`);
                    });
                } else {
                    console.log("No KR streaming options.");
                }
            } else {
                console.log(`Status: ${response.status}`);
            }
        } catch (e) {
            console.error(e);
        }
    }
}

testByIds();
