import https from 'node:https';

const checkTitle = (term) => {
    const url = 'https://www.justwatch.com/kr/%EA%B2%80%EC%83%89?q=' + encodeURIComponent(term);
    const options = {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    };
    console.log(`Checking ${term}...`);
    https.get(url, options, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
            const match = data.match(/href="(\/kr\/(?:영화|TV_프로그램)\/[^"]+)"/);
            if (match) {
                const detailUrl = 'https://www.justwatch.com' + match[1];
                console.log(`Detail URL: ${detailUrl}`);
                https.get(detailUrl, options, (res2) => {
                    let d = '';
                    res2.on('data', c => d += c);
                    res2.on('end', () => {
                        // Find all occurrences
                        const regex = /스트리밍 서비스 중이며/g;
                        let m;
                        let count = 0;
                        while ((m = regex.exec(d)) !== null) {
                            count++;
                            console.log(`Match ${count}: ...${d.substring(m.index - 200, m.index + 50)}...`);
                        }
                        if (count === 0) console.log('No "Coupang Play" string found.');
                    });
                });
            } else {
                console.log(`Link Not Found for ${term}`);
            }
        });
    });
};

checkTitle('나 홀로 집에'); // 1 (Exist)
setTimeout(() => checkTitle('나 홀로 집에 4'), 3000); // 4 (Not Exist)
