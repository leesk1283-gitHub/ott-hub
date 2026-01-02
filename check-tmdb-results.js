// Debug: Check what TMDB returns for "진격의 거인" search
const TMDB_API_KEY = 'eb11bb474eef7856758589fb09e65c29';

async function checkTMDBResults() {
    const query = '진격의 거인';
    const url = `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=ko-KR&page=1`;

    console.log('=== TMDB Search Results for "진격의 거인" ===\n');

    const res = await fetch(url);
    const data = await res.json();

    if (data.results) {
        data.results.forEach((item, idx) => {
            const title = item.title || item.name || 'Unknown';
            const type = item.media_type;
            const id = item.id;
            console.log(`[${idx + 1}] ${type.toUpperCase()} | ID: ${id} | ${title}`);
        });
    }

    console.log(`\nTotal: ${data.results?.length || 0} results from TMDB`);
}

checkTMDBResults();
