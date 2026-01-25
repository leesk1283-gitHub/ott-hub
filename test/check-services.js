const RAPID_API_KEY = 'fdd47c2553mshd19015530c43e2cp1a9d7djsn31c6ad035190';
const RAPID_API_HOST = 'streaming-availability.p.rapidapi.com';

async function findService(keyword) {
    const url = `https://${RAPID_API_HOST}/countries/kr`;
    const res = await fetch(url, { headers: { 'x-rapidapi-key': RAPID_API_KEY, 'x-rapidapi-host': RAPID_API_HOST } });
    const data = await res.json();
    const str = JSON.stringify(data.services).toLowerCase();
    console.log(`Searching for "${keyword}": ${str.includes(keyword.toLowerCase())}`);
}
findService('google');
findService('youtube');
findService('naver');
