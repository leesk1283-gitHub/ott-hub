import https from 'node:https';

const url = 'https://www.justwatch.com/kr/%EA%B2%80%EC%83%89?q=' + encodeURIComponent('나 홀로 집에');
const options = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
    }
};

https.get(url, options, (res) => {
    console.log('Status:', res.statusCode);
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
        // console.log('Data:', data.substring(0, 500));
        const match = data.match(/href="(\/kr\/(?:영화|TV_프로그램)\/[^"]+)"/);
        if (match) {
            console.log('Found Link:', match[1]);
            // 링크 찾았으면 상세 페이지도 긁어보자
            const detailUrl = 'https://www.justwatch.com' + match[1];
            https.get(detailUrl, options, (res2) => {
                let details = '';
                res2.on('data', c => details += c);
                res2.on('end', () => {
                    console.log('Detail Loaded. Length:', details.length);
                    if (details.includes('Coupang Play')) console.log('Coupang Play Found!');
                    else console.log('Coupang Play NOT Found');
                });
            });
        }
        else console.log('Link Not Found');
    });
});
