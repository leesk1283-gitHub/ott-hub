import fs from 'fs';

async function getCpSearchData(query) {
    const url = `https://www.coupangplay.com/search?keyword=${encodeURIComponent(query)}`;
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

    console.log(`Searching CP: ${url}`);
    try {
        const res = await fetch(proxyUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'ko-KR,ko;q=0.9'
            }
        });
        const html = await res.text();

        // Find __NEXT_DATA__
        const match = html.match(/<script id="__NEXT_DATA__".*?>(.*?)<\/script>/);
        if (match) {
            const json = JSON.parse(match[1]);
            fs.writeFileSync('cp_search_debug.json', JSON.stringify(json, null, 2));
            console.log("Saved cp_search_debug.json");

            // Search for movie IDs and titles
            // In Next.js pages, data is often in props.pageProps.initialData or similar
            const str = JSON.stringify(json);

            // Regex to find "titles/[id]" or just IDs in titles array
            const idMatches = str.match(/"titleId":"([^"]+)"/g);
            console.log("Found Title IDs:", idMatches ? idMatches.slice(0, 5) : "None");

        } else {
            console.log("No __NEXT_DATA__ found in search.");
        }
    } catch (e) {
        console.error(e);
    }
}

getCpSearchData('나 홀로 집에');
