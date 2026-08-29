const RAPID_API_KEY = process.env.RAPID_API_KEY;
const RAPID_API_HOST = 'streaming-availability.p.rapidapi.com';

async function testFormats() {
    const formats = [
        'shows/movie/771',      // Format used before
        'shows/series/210191',
        'shows/tmdb/movie/771',
        'shows/tmdb/tv/210191',
        'shows/tmdb/series/210191'
    ];

    for (const f of formats) {
        console.log(`\n--- Testing: ${f} ---`);
        const url = `https://${RAPID_API_HOST}/${f}?country=kr`;
        const options = {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': RAPID_API_KEY,
                'X-RapidAPI-Host': RAPID_API_HOST
            }
        };

        try {
            const response = await fetch(url, options);
            console.log(`Status: ${response.status}`);
            if (response.status === 200) {
                const data = await response.json();
                console.log(`Title: ${data.title}`);
            }
        } catch (e) {
            console.error(e);
        }
    }
}

testFormats();
