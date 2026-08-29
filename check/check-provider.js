const RAPID_API_KEY = process.env.RAPID_API_KEY;
const RAPID_API_HOST = 'streaming-availability.p.rapidapi.com';

async function test() {
    const title = '나 홀로 집에';
    const pricingUrl = `https://${RAPID_API_HOST}/shows/search/title?title=${encodeURIComponent(title)}&country=kr`;
    const res = await fetch(pricingUrl, {
        method: 'GET',
        headers: { 'X-RapidAPI-Key': RAPID_API_KEY, 'X-RapidAPI-Host': RAPID_API_HOST }
    });
    const data = await res.json();
    const shows = Array.isArray(data) ? data : data.result;

    shows.forEach(show => {
        const kr = show.streamingOptions?.kr;
        if (kr) {
            kr.forEach(opt => {
                console.log(`Title: ${show.title}, Provider ID: ${opt.service.id}, Provider Name: ${opt.service.name}`);
            });
        }
    });
}

test();
