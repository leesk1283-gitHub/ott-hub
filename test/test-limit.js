const RAPID_API_KEY = 'fdd47c2553mshd19015530c43e2cp1a9d7djsn31c6ad035190';
const RAPID_API_HOST = 'streaming-availability.p.rapidapi.com';

async function testLimit() {
    for (let i = 0; i < 10; i++) {
        const url = `https://${RAPID_API_HOST}/shows/movie/771?country=kr`;
        const res = await fetch(url, { headers: { 'x-rapidapi-key': RAPID_API_KEY, 'x-rapidapi-host': RAPID_API_HOST } });
        console.log(`Req ${i}: ${res.status}`);
        if (res.status !== 200) {
            console.log(await res.text());
            break;
        }
        await new Promise(r => setTimeout(r, 200));
    }
}
testLimit();
