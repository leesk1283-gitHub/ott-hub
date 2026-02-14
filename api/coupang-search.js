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
        // JustWatch GraphQL API 엔드포인트
        const graphqlUrl = 'https://apis.justwatch.com/content/graphql';

        // GraphQL 쿼리 정의
        const query = `
            query GetSuggestedTitles($country: Country!, $language: Language!, $filter: TitleFilter) {
                popularTitles(country: $country, filter: $filter) {
                    edges {
                        node {
                            content(country: $country, language: $language) {
                                title
                                originalTitle
                                offers {
                                    monetizationType
                                    provider {
                                        id
                                        shortName
                                        clearName
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        // 변수 설정
        const variables = {
            country: "KR",
            language: "ko",
            filter: { searchQuery: title }
        };

        const response = await fetch(graphqlUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            body: JSON.stringify({ query, variables }),
            signal: AbortSignal.timeout(5000)
        });

        if (!response.ok) {
            throw new Error(`JustWatch API Error: ${response.status}`);
        }

        const result = await response.json();

        // 데이터 파싱
        const edges = result.data?.popularTitles?.edges || [];

        if (edges.length === 0) {
            return res.status(200).json({
                exists: false,
                message: 'Content not found in JustWatch',
                fallback: false
            });
        }

        // 첫 번째 결과 사용 (가장 정확도 높음)
        const firstNode = edges[0].node;
        const offers = firstNode.content?.offers || [];

        // 쿠팡플레이 존재 여부 확인
        // shortName: 'cpx', clearName: 'Coupang Play'
        const coupangOffer = offers.find(offer =>
            offer.provider?.shortName === 'cpx' ||
            offer.provider?.clearName === 'Coupang Play'
        );

        const exists = !!coupangOffer;
        let isFree = false;
        let priceText = '검색(이동)';
        let price = 0;

        if (exists) {
            // monetizationType: 'FLATRATE' (구독), 'BUY' (구매), 'RENT' (대여)
            if (coupangOffer.monetizationType === 'FLATRATE') {
                isFree = true;
                priceText = '와우 회원 무료';
            } else if (coupangOffer.monetizationType === 'BUY') {
                priceText = '개별구매';
                price = 5000; // 예상 가격
            } else if (coupangOffer.monetizationType === 'RENT') {
                priceText = '대여';
                price = 1200; // 예상 가격
            }
        }

        return res.status(200).json({
            exists: exists,
            price: price,
            isFree: isFree,
            priceText: priceText,
            rawPrice: price,
            fallback: false,
            providerName: 'JustWatch GraphQL'
        });

    } catch (error) {
        console.error('Coupang search error:', error);
        return res.status(200).json({
            error: 'Server error',
            message: error.message,
            exists: false,
            fallback: true
        });
    }
}
