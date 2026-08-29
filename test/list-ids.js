const RAPID_API_KEY = process.env.RAPID_API_KEY;
const RAPID_API_HOST = 'streaming-availability.p.rapidapi.com';

async function listServices() {
    const url = `https://${RAPID_API_HOST}/countries/kr`;
    const res = await fetch(url, { headers: { 'x-rapidapi-key': RAPID_API_KEY, 'x-rapidapi-host': RAPID_API_HOST } });
    const data = await res.json();
    Object.values(data.services).forEach(s => {
        console.log(`${s.id} : ${s.name}`);
    });
}
listServices();
