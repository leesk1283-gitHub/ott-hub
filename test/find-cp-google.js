async function findCpIdViaGoogle(title) {
    const query = `site:coupangplay.com "${title}"`;
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

    console.log(`Searching Google for CP titles: ${url}`);
    try {
        const res = await fetch(proxyUrl);
        const text = await res.text();
        console.log(`   Google Response Length: ${text.length}`);

        // Find titles/XXXXXX
        const matches = text.match(/titles\/([a-zA-Z0-9-]{36}|[a-zA-Z0-9]{8})/g);
        if (matches) {
            console.log("   >>> FOUND CP IDs ON GOOGLE:", matches.slice(0, 5));
            return matches.map(m => m.split('/').pop());
        } else {
            console.log("No CP IDs found on Google results.");
        }
    } catch (e) {
        console.error(e);
    }
}

findCpIdViaGoogle('나 홀로 집에');
