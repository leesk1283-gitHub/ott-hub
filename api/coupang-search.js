/**
 * Vercel Serverless Function
 * 쿠팡플레이 검색 및 가격 추출
 */

export default async function handler(req, res) {
    // CORS 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { title } = req.query;

    if (!title) {
        return res.status(400).json({ error: 'Title parameter is required' });
    }

    try {
        const searchUrl = `https://www.justwatch.com/kr/검색?q=${encodeURIComponent(title)}`;

        // 헤더 설정 (중요: User-Agent, Accept-Language)
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
        };

        const searchRes = await fetch(searchUrl, { headers, signal: AbortSignal.timeout(5000) });

        if (!searchRes.ok) {
            throw new Error(`JustWatch Search Failed: ${searchRes.status}`);
        }

        const searchHtml = await searchRes.text();

        // 첫 번째 결과 링크 추출
        // 영화: /kr/영화/...
        // TV: /kr/TV_프로그램/...
        const linkMatch = searchHtml.match(/href="(\/kr\/(?:영화|TV_프로그램)\/[^"]+)"/);

        if (!linkMatch) {
            return res.status(200).json({
                exists: false,
                message: 'Content not found in JustWatch',
                fallback: false
            });
        }

        const detailUrl = `https://www.justwatch.com${linkMatch[1]}`;

        // 상세 페이지 가져오기
        const detailRes = await fetch(detailUrl, { headers, signal: AbortSignal.timeout(5000) });

        if (!detailRes.ok) {
            throw new Error(`JustWatch Detail Failed: ${detailRes.status}`);
        }

        const detailHtml = await detailRes.text();

        // Offer ID 파싱 및 디코딩 (가장 정확한 방법)
        // "Offer:BASE64String" 형태의 키를 찾아서 디코딩
        const offerRegex = /"Offer:([^"]+)"/g;
        let match;
        let exists = false;
        let priceText = '검색(이동)';
        let isFree = false;
        let price = 0;

        while ((match = offerRegex.exec(detailHtml)) !== null) {
            const encodedId = match[1];
            try {
                // base64 디코딩
                const decodedToken = Buffer.from(encodedId, 'base64').toString('utf-8');

                // 한국(KR)의 쿠팡플레이(cou) 오퍼인지 확인
                if (decodedToken.includes(':KR:') && decodedToken.includes(':cou:')) {
                    exists = true;

                    // Offer JSON 데이터 파싱을 위해 주변 문자열 추출
                    // "Offer:ID":{...}
                    const jsonStart = detailHtml.indexOf(`"Offer:${encodedId}"`);
                    if (jsonStart !== -1) {
                        const snippet = detailHtml.substring(jsonStart, jsonStart + 600);

                        // monetizationType 추출
                        const typeMatch = snippet.match(/"monetizationType":"([^"]+)"/);
                        const type = typeMatch ? typeMatch[1] : '';

                        // retailPrice 추출
                        const priceMatch = snippet.match(/"retailPrice(?:\([^)]+\))?":([^,}]+)/);

                        const rawPriceVal = priceMatch ? priceMatch[1] : '0';
                        // 숫자가 아니거나 null일 수 있음
                        price = parseFloat(rawPriceVal) || 0;

                        if (type === 'FLATRATE') {
                            isFree = true;
                            priceText = '와우 회원 무료';
                        } else if (type === 'RENT') {
                            priceText = `대여 ${price.toLocaleString()}원`;
                        } else if (type === 'BUY') {
                            priceText = `구매 ${price.toLocaleString()}원`;
                        } else if (type === 'FREE') {
                            isFree = true;
                            priceText = '무료';
                        } else {
                            priceText = '보기';
                        }
                    }
                    break; // 찾았으면 중단
                }
            } catch (e) {
                // 디코딩 에러 무시
            }
        }

        // 2차 확인: 오퍼 파싱에서 실패했더라도 'cpx' (CosmoGo/Cineplex 등으로 추정되나 쿠팡플레이와 연동되는 식별자)가 있다면 허용
        // 이전 로직에서 "나 홀로 집에 1"은 찾고 "4"는 제외하는 데 성공했던 검증된 로직
        if (!exists) {
            const cpxExists = /"shortName":"cpx"/.test(detailHtml);
            if (cpxExists) {
                exists = true;
                isFree = true;
                priceText = '와우 회원 무료'; // 상세 정보를 못 찾았지만 존재한다면 대부분 구독 무료
            }
        }

        return res.status(200).json({
            exists: exists,
            price: price,
            isFree: isFree,
            priceText: priceText,
            rawPrice: price,
            fallback: false,
            link: detailUrl,
            providerName: 'JustWatch Web Scraping (cpx check)'
        });

    } catch (error) {
        console.error('JustWatch scraping error:', error);
        return res.status(200).json({
            error: 'Server error',
            message: error.message,
            exists: false, // 에러 발생 시 없음으로 처리
            fallback: true
        });
    }
}
