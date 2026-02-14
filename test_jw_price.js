import https from 'node:https';

const checkTitle = (term) => {
    const url = 'https://www.justwatch.com/kr/%EA%B2%80%EC%83%89?q=' + encodeURIComponent(term);
    const options = {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    };
    https.get(url, options, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
            const match = data.match(/href="(\/kr\/(?:영화|TV_프로그램)\/[^"]+)"/);
            if (match) {
                const detailUrl = 'https://www.justwatch.com' + match[1];
                https.get(detailUrl, options, (res2) => {
                    let d = '';
                    res2.on('data', c => d += c);
                    res2.on('end', () => {
                        const regex = /"Offer:([^"]+)"/g;
                        let m;
                        console.log(`--- Offers for ${term} ---`);
                        while ((m = regex.exec(d)) !== null) {
                            const encodedId = m[1];
                            try {
                                const decoded = Buffer.from(encodedId, 'base64').toString('utf-8');
                                if (decoded.includes(':KR:')) {
                                    console.log(decoded);
                                }
                            } catch (e) { }
                        }
                    });
                });
            }
        });
    });
};

checkTitle('나 홀로 집에');
