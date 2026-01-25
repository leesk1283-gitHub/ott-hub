import fs from 'fs';

async function extractNextData(keyword) {
    const url = `https://www.coupangplay.com/query?src=page_search&keyword=${encodeURIComponent(keyword)}`;
    console.log(`Checking Coupang Play for: ${keyword}`);

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            }
        });

        const text = await response.text();
        const marker = '__NEXT_DATA__" type="application/json">';
        const start = text.indexOf(marker);

        if (start === -1) {
            console.log("No NEXT_DATA found.");
            return;
        }

        const dataStart = start + marker.length;
        const end = text.indexOf('</script>', dataStart);
        const jsonStr = text.substring(dataStart, end);

        fs.writeFileSync('next_data.json', jsonStr);
        console.log("Saved next_data.json");

        const data = JSON.parse(jsonStr);
        // Look for results
        console.log("Keys in props:", Object.keys(data.props || {}));
        if (data.props?.pageProps) {
            console.log("Keys in pageProps:", Object.keys(data.props.pageProps));
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

extractNextData('나 홀로 집에');
