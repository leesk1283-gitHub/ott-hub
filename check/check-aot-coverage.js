// Debug: Check OTT availability for all Attack on Titan related content
const TMDB_API_KEY = 'eb11bb474eef7856758589fb09e65c29';
const RAPID_API_KEY = 'fdd47c2553mshd19015530c43e2cp1a9d7djsn31c6ad035190';
const RAPID_API_HOST = 'streaming-availability.p.rapidapi.com';

const AOT_CONTENT = [
    { id: 1429, type: 'tv', title: '진격의 거인' },
    { id: 379088, type: 'movie', title: '진격의 거인: 홍련의 화살' },
    { id: 330081, type: 'movie', title: '진격의 거인: 자유의 날개' },
    { id: 714194, type: 'movie', title: '진격의 거인 크로니클' },
    { id: 65242, type: 'tv', title: '진격의 거인: 반격의 봉화' },
    { id: 1333100, type: 'movie', title: '극장판 진격의 거인 완결편' },
];

async function checkAllAOTContent() {
    for (const content of AOT_CONTENT) {
        console.log(`\n=== ${content.title} (TMDB ${content.id}) ===`);

        // Check Streaming Availability API
        try {
            const url = `https://${RAPID_API_HOST}/shows/${content.type}/${content.id}?country=kr`;
            const res = await fetch(url, {
                headers: { 'X-RapidAPI-Key': RAPID_API_KEY, 'X-RapidAPI-Host': RAPID_API_HOST }
            });
            if (res.status === 200) {
                const data = await res.json();
                if (data.streamingOptions?.kr) {
                    const providers = [...new Set(data.streamingOptions.kr.map(o => o.service?.name || o.service?.id))];
                    console.log(`  [Premium API] ${providers.join(', ')}`);
                } else {
                    console.log(`  [Premium API] No KR data`);
                }
            } else {
                console.log(`  [Premium API] Not found (${res.status})`);
            }
        } catch (e) {
            console.log(`  [Premium API] Error: ${e.message}`);
        }

        // Check TMDB Watch Providers
        try {
            const url = `https://api.themoviedb.org/3/${content.type}/${content.id}/watch/providers?api_key=${TMDB_API_KEY}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.results?.KR) {
                const kr = data.results.KR;
                const providers = [];
                if (kr.flatrate) providers.push(...kr.flatrate.map(p => p.provider_name + '(구독)'));
                if (kr.buy) providers.push(...kr.buy.map(p => p.provider_name + '(구매)'));
                if (kr.rent) providers.push(...kr.rent.map(p => p.provider_name + '(대여)'));
                console.log(`  [TMDB] ${providers.join(', ') || 'No providers'}`);
            } else {
                console.log(`  [TMDB] No KR data`);
            }
        } catch (e) {
            console.log(`  [TMDB] Error: ${e.message}`);
        }
    }
}

checkAllAOTContent();
