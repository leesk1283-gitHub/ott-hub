/**
 * OTT Search Service (Smart Real-Time + Adaptive Scraping Engine V6)
 */

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w200';
const TMDB_API_KEY = 'eb11bb474eef7856758589fb09e65c29';

const RAPID_API_KEY = 'fdd47c2553mshd19015530c43e2cp1a9d7djsn31c6ad035190';
const RAPID_API_HOST = 'streaming-availability.p.rapidapi.com';

/**
 * Fetch streaming data from Streaming Availability API (RapidAPI)
 */
async function fetchByTmdbId(tmdbId, mediaType) {
    try {
        // RapidAPI는 tv 대신 series를 사용함
        const rapidType = mediaType === 'tv' ? 'series' : 'movie';
        const url = `https://${RAPID_API_HOST}/shows/${rapidType}/${tmdbId}?country=kr`;
        const res = await fetch(url, {
            method: 'GET',
            headers: { 'X-RapidAPI-Key': RAPID_API_KEY, 'X-RapidAPI-Host': RAPID_API_HOST }
        });
        if (res.status === 200) return await res.json();
    } catch (e) { }
    return null;
}

// OTT별 공식 사이트 다이렉트 검색 링크 생성
const getDirectSearchLink = (ottName, title) => {
    const query = encodeURIComponent(title);
    const lowName = ottName.toLowerCase();

    if (lowName.includes('netflix')) return `https://www.netflix.com/search?q=${query}`;
    if (lowName.includes('disney')) return `https://www.disneyplus.com/search?q=${query}`;
    if (lowName.includes('tving')) return `https://www.tving.com/search/all?keyword=${query}`;
    if (lowName.includes('wavve')) return `https://www.wavve.com/search/search?searchkeyword=${query}`;
    if (lowName.includes('watcha')) return `https://watcha.com/search?query=${query}`;
    if (lowName.includes('apple')) return `https://tv.apple.com/kr/search?term=${query}`;
    if (lowName.includes('google')) return `https://play.google.com/store/search?q=${query}&c=movies`;
    if (lowName.includes('naver')) return `https://serieson.naver.com/v2/search?query=${query}`;
    if (lowName.includes('youtube')) return `https://www.youtube.com/results?search_query=${query}`;

    return `https://www.google.com/search?q=${encodeURIComponent(title + " " + ottName)}`;
};

export const searchOTT = async (query) => {
    if (!query || !TMDB_API_KEY) return [];

    const queryClean = query.trim();
    const queryNoSpace = queryClean.replace(/\s/g, '').toLowerCase();

    const normalizeProvider = (name) => {
        if (!name) return 'Unknown';
        const lowName = name.toLowerCase();
        if (lowName.includes('disney')) return 'Disney+';
        if (lowName.includes('netflix')) return 'Netflix';
        if (lowName.includes('wavve')) return 'wavve';
        if (lowName.includes('watcha')) return 'Watcha';
        if (lowName.includes('tving')) return 'TVING';
        if (lowName.includes('apple')) return 'Apple TV';
        if (lowName.includes('google')) return 'Google Play';
        if (lowName.includes('youtube')) return 'YouTube';
        if (lowName.includes('naver')) return 'Naver SeriesOn';
        if (lowName.includes('coupang')) return 'Coupang Play';
        return name;
    };

    try {
        let searchRes = await fetch(`${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(queryClean)}&language=ko-KR&page=1`);
        if (!searchRes.ok) return [];
        let searchData = await searchRes.json();

        if (!searchData.results) return [];

        const itemsToProcess = [...searchData.results.slice(0, 16)];
        const processedCollectionIds = new Set();

        // 1. Collection Expansion (시리즈물 챙기기)
        for (const item of searchData.results.slice(0, 4)) {
            if (item.media_type === 'movie') {
                try {
                    const detailRes = await fetch(`${TMDB_BASE_URL}/movie/${item.id}?api_key=${TMDB_API_KEY}&language=ko-KR`);
                    const details = await detailRes.json();
                    if (details.belongs_to_collection && !processedCollectionIds.has(details.belongs_to_collection.id)) {
                        processedCollectionIds.add(details.belongs_to_collection.id);
                        const cRes = await fetch(`${TMDB_BASE_URL}/collection/${details.belongs_to_collection.id}?api_key=${TMDB_API_KEY}&language=ko-KR`);
                        const cData = await cRes.json();
                        if (cData.parts) {
                            cData.parts.forEach(part => {
                                if (!itemsToProcess.some(it => it.id === part.id)) itemsToProcess.push({ ...part, media_type: 'movie' });
                            });
                        }
                    }
                } catch (e) { }
            }
        }

        const finalResults = [];
        const priorityItems = itemsToProcess.slice(0, 12);

        for (const item of priorityItems) {
            const type = item.media_type || 'movie';
            const fullTitle = item.title || item.name;
            const providersMap = new Map();
            let kr = null;
            let deepData = null;

            // Step A: TMDB 기본 정보 가져오기
            try {
                const wpRes = await fetch(`${TMDB_BASE_URL}/${type}/${item.id}/watch/providers?api_key=${TMDB_API_KEY}`);
                const wpData = await wpRes.json();
                kr = wpData.results?.KR;
                if (kr) {
                    ['flatrate', 'buy', 'rent'].forEach(cat => {
                        if (kr[cat]) {
                            kr[cat].forEach(p => {
                                const pName = normalizeProvider(p.provider_name);
                                providersMap.set(pName, {
                                    name: pName,
                                    texts: [cat === 'flatrate' ? '구독(무료)' : `개별구매`],
                                    prices: [cat === 'flatrate' ? 0 : 5000],
                                    type: cat,
                                    link: getDirectSearchLink(pName, fullTitle) // 다이렉트 링크 사용!
                                });
                            });
                        }
                    });
                }
            } catch (e) { }

            // Step B: Premium API로 실시간 가격 및 진짜 딥링크 가져오기
            deepData = await fetchByTmdbId(item.id, type);
            if (deepData && deepData.streamingOptions?.kr) {
                deepData.streamingOptions.kr.forEach(opt => {
                    const pName = normalizeProvider(opt.service?.name || opt.service?.id);
                    let priceVal = opt.price ? parseInt(opt.price.amount) : (opt.type === 'subscription' ? 0 : 5000);
                    let priceText = opt.price
                        ? `${opt.type === 'buy' ? '소장 ' : '대여 '}${priceVal.toLocaleString()}원`
                        : (opt.type === 'subscription' ? '구독(무료)' : '개별구매');

                    if (!providersMap.has(pName)) {
                        providersMap.set(pName, { name: pName, texts: [priceText], prices: [priceVal], type: opt.type, link: opt.link });
                    } else {
                        const existing = providersMap.get(pName);
                        if (opt.link) existing.link = opt.link; // 진짜 링크 확보!
                        if (!existing.texts.includes(priceText)) {
                            existing.texts.push(priceText);
                            existing.prices.push(priceVal);
                        }
                    }
                });
            }

            // Step C: 쿠팡플레이 서버리스 크롤링 확인
            try {
                const apiUrl = `/api/coupang-search?title=${encodeURIComponent(fullTitle)}`;
                const cpRes = await fetch(apiUrl, { signal: AbortSignal.timeout(6000) });
                if (cpRes.ok) {
                    const cpData = await cpRes.json();
                    if (cpData.exists) { // 실제로 존재할 때만 추가!!
                        const isFree = cpData.isFree || false;
                        const priceText = cpData.priceText || (cpData.fallback ? '개별구매' : '개별구매');
                        const priceVal = cpData.rawPrice || (isFree ? 0 : 5000);

                        providersMap.set('Coupang Play', {
                            name: 'Coupang Play',
                            texts: [priceText],
                            prices: [priceVal],
                            type: isFree ? 'subscription' : 'buy',
                            link: `https://www.coupangplay.com/query?src=page_search&keyword=${encodeURIComponent(fullTitle)}`
                        });
                    }
                }
            } catch (e) {
                // 에러 시에는 TMDB에 쿠팡플레이 정보가 있는 경우에만 표시
                const hasInTmdb = kr && ['flatrate', 'buy', 'rent'].some(cat =>
                    kr[cat]?.some(p => normalizeProvider(p.provider_name) === 'Coupang Play')
                );
                if (hasInTmdb) {
                    providersMap.set('Coupang Play', {
                        name: 'Coupang Play',
                        texts: ['개별구매'],
                        prices: [5000],
                        type: 'buy',
                        link: `https://www.coupangplay.com/query?src=page_search&keyword=${encodeURIComponent(fullTitle)}`
                    });
                }
            }

            // 최종 병합 (Final consolidation)
            providersMap.forEach((info, pName) => {
                const combinedText = info.texts.join(' / ');
                const lowestPrice = Math.min(...info.prices);

                // 이미 위에서 getDirectSearchLink 또는 opt.link로 채워진 링크를 그대로 사용
                // (구글 검색이나 TMDB 중계 페이지는 더 이상 사용하지 않음)
                const finalLink = info.link;

                finalResults.push({
                    id: `v11-${item.id}-${pName.replace(/\s+/g, '')}`,
                    title: fullTitle,
                    ott: pName,
                    price: lowestPrice,
                    priceText: combinedText,
                    image: item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : '',
                    description: item.overview ? item.overview.slice(0, 100) + '...' : '내용 설명이 없습니다.',
                    release_date: item.release_date || item.first_air_date || '0000-00-00',
                    link: finalLink
                });
            });
        }

        return finalResults.sort((a, b) => {
            const aMatch = a.title.replace(/\s/g, '').toLowerCase() === queryNoSpace;
            const bMatch = b.title.replace(/\s/g, '').toLowerCase() === queryNoSpace;
            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;
            if (a.release_date !== b.release_date) return b.release_date.localeCompare(a.release_date);
            return a.price - b.price;
        });
    } catch (error) {
        return [];
    }
};

export const getOTTIcon = (ottName) => {
    const name = ottName.toLowerCase();
    if (name.includes('netflix')) return '🔴';
    if (name.includes('disney')) return '🔵';
    if (name.includes('tving')) return '⚪';
    if (name.includes('wavve')) return '🌊';
    if (name.includes('watcha')) return '🌸';
    if (name.includes('coupang')) return '🚀';
    if (name.includes('apple')) return '🍎';
    if (name.includes('google')) return '🎯';
    if (name.includes('youtube')) return '🎬';
    if (name.includes('naver')) return '🟢';
    return '📺';
};

export const formatPrice = (priceText) => priceText;
