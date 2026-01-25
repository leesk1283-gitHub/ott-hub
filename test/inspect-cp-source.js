import fs from 'fs';

async function inspectCpSource(title) {
    const url = `https://www.coupangplay.com/search?keyword=${encodeURIComponent(title)}`;
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

    try {
        const res = await fetch(proxyUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
        });
        const html = await res.text();
        console.log(`Title: ${title}, Length: ${html.length}`);

        // Find ALL script tags with JSON
        const match = html.match(/<script id="__NEXT_DATA__".*?>(.*?)<\/script>/);
        if (match) {
            console.log("Found __NEXT_DATA__!");
            const jsonStr = match[1];

            // Check for unicode escaped "나 홀로 집에"
            // \ub098\u0020\ud640\ub85c\u0020\uc9d1\uc5d0
            console.log("Contains '\\ub098':", jsonStr.includes('\\ub098'));

            fs.writeFileSync('cp_debug.json', jsonStr);
            console.log("Saved cp_debug.json");

            const json = JSON.parse(jsonStr);
            // Deep search for title and price in object
            function findData(obj) {
                let results = [];
                const str = JSON.stringify(obj);
                // Look for "displayTitle" or equivalent
                // In CP, it might be inside queries or search result arrays
                return str.match(/"title":"[^"]+"/g);
            }
            const titles = findData(json);
            console.log("Titles found in JSON:", titles ? titles.slice(0, 5) : 'None');

        } else {
            console.log("No __NEXT_DATA__ found.");
        }
    } catch (e) {
        console.error(e);
    }
}
inspectCpSource('나 홀로 집에');
