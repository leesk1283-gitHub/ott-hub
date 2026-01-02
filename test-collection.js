const TMDB_API_KEY = 'eb11bb474eef7856758589fb09e65c29';
const BASE_URL = 'https://api.themoviedb.org/3';

async function testCollection() {
    // 1. Get Home Alone 1 details to find collection ID
    console.log("--- Checking Home Alone (ID: 771) for Collection ---");
    const res = await fetch(`${BASE_URL}/movie/771?api_key=${TMDB_API_KEY}&language=ko-KR`);
    const data = await res.json();

    if (data.belongs_to_collection) {
        const collectionId = data.belongs_to_collection.id;
        console.log(`Found Collection: ${data.belongs_to_collection.name} (ID: ${collectionId})`);

        // 2. Fetch all movies in the collection
        const cRes = await fetch(`${BASE_URL}/collection/${collectionId}?api_key=${TMDB_API_KEY}&language=ko-KR`);
        const cData = await cRes.json();
        console.log("Movies in Collection:", cData.parts.map(p => `${p.title} (ID: ${p.id})`));
    } else {
        console.log("No collection found for ID 771.");
    }
}

testCollection();
