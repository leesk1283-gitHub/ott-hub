const { searchOTT } = require('./src/services/ottService');

// Mock DOM elements for the service to run in Node
global.document = {
    createElement: () => ({}),
    getElementById: () => null
};
global.window = {};

async function checkNetflixText() {
    console.log("Searching for Home Alone...");
    // "나홀로 집에"
    const results = await searchOTT("나홀로 집에");

    // Find Netflix entry
    const netflixItems = results.filter(r => r.ott === 'Netflix');

    if (netflixItems.length === 0) {
        console.log("No Netflix results found for '나홀로 집에'. Trying '기생충'...");
        const res2 = await searchOTT("기생충");
        const netflix2 = res2.filter(r => r.ott === 'Netflix');
        netflix2.forEach(item => {
            console.log(`Title: ${item.title}`);
            console.log(`Full Price Text: "${item.priceText}"`);
        });
        return;
    }

    netflixItems.forEach(item => {
        console.log(`Title: ${item.title}`);
        console.log(`Full Price Text: "${item.priceText}"`);
    });
}

checkNetflixText();
