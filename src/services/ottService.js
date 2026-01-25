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
        const url = `https://${RAPID_API_HOST}/shows/${mediaType}/${tmdbId}?country=kr`;
        const res = await fetch(url, {
            method: 'GET',
            headers: { 'X-RapidAPI-Key': RAPID_API_KEY, 'X-RapidAPI-Host': RAPID_API_HOST }
        });
        if (res.status === 200) return await res.json();
    } catch (e) { }
    return null;
}

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

        // Collection Expansion
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

            // A. TMDB Watch Providers (Base)
            try {
                const wpRes = await fetch(`${TMDB_BASE_URL}/${type}/${item.id}/watch/providers?api_key=${TMDB_API_KEY}`);
                const wpData = await wpRes.json();
                const kr = wpData.results?.KR;
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
                                    link: `https://www.google.com/search?q=${encodeURIComponent(fullTitle + " " + pName)}`
                                });
                            });
                        }
                    });
                }
            } catch (e) { }

            // B. Premium API (Detailed Prices)
            const deepData = await fetchByTmdbId(item.id, type);
            if (deepData && deepData.streamingOptions?.kr) {
                deepData.streamingOptions.kr.forEach(opt => {
                    const providerName = normalizeProvider(opt.service?.name || opt.service?.id);
                    let priceVal = opt.price ? parseInt(opt.price.amount) : (opt.type === 'subscription' ? 0 : 5000);
                    let priceText = opt.price
                        ? `${opt.type === 'buy' ? '소장 ' : '대여 '}${priceVal.toLocaleString()}원`
                        : (opt.type === 'subscription' ? '구독(무료)' : '개별구매');

                    if (!providersMap.has(providerName)) {
                        providersMap.set(providerName, { name: providerName, texts: [priceText], prices: [priceVal], type: opt.type, link: opt.link });
                    } else {
                        const existing = providersMap.get(providerName);
                        if (!existing.texts.includes(priceText)) {
                            existing.texts.push(priceText);
                            existing.prices.push(priceVal);
                        }
                    }
                });
            }

            // C. Coupang Play - TMDB/Premium API + 쿠팡 검색 검증
            try {
                if (!providersMap.has('Coupang Play')) {
                    // Step 1: TMDB나 Premium API에 있는지 확인
                    const hasInPremiumApi = deepData?.streamingOptions?.kr?.some(opt =>
                        normalizeProvider(opt.service?.name || opt.service?.id) === 'Coupang Play'
                    );
                    const hasInTmdb = kr && ['flatrate', 'buy', 'rent'].some(cat =>
                        kr[cat]?.some(p => normalizeProvider(p.provider_name) === 'Coupang Play')
                    );

                    // Step 2: 무조건 서버리스 API로 쿠팡 검색 및 가격 확인 시도
                    // TMDB 데이터 누락 가능성 대응
                    let verified = false;
                    let cpPrice = null;
                    let cpIsFree = false;
                    let isFallback = false;

                    try {
                        // Vercel Serverless Function 호출
                        const apiUrl = `/api/coupang-search?title=${encodeURIComponent(fullTitle)}`;
                        const cpRes = await fetch(apiUrl, { signal: AbortSignal.timeout(10000) });

                        if (cpRes.ok) {
                            const cpData = await cpRes.json();
                            verified = cpData.exists;
                            cpPrice = cpData.rawPrice;
                            cpIsFree = cpData.isFree;
                            isFallback = cpData.fallback || false;
                        }
                    } catch (e) {
                        console.error('Coupang API call fatal error:', e);
                        verified = true;
                        isFallback = true;
                    }

                    console.log(`Coupang Search for "${fullTitle}": verified=${verified}, fallback=${isFallback}`);

                    if (verified) {
                        // Step 3: 서버 데이터 우선 사용, 없으면 JustWatch 백업
                        let isFree = cpIsFree;
                        let priceVal = cpPrice || 5000;
                        let priceText = '개별구매';

                        if (cpPrice !== null) {
                            // 서버에서 가격을 찾은 경우
                            priceText = `개별구매 ${cpPrice.toLocaleString()}원`;
                        } else if (cpIsFree) {
                            // 서버에서 무료로 확인된 경우
                            isFree = true;
                            priceText = '와우 회원 무료';
                            priceVal = 0;
                        } else if (isFallback) {
                            // 쿠팡 서버가 봇을 차단한 경우 (Fallback)
                            // JustWatch 확인 없이 안전하게 표시 (오차단 방지보다 표시 우선)
                            // TMDB에서 무료(flatrate)라고 했으면 무료로, 아니면 개별구매로 표시
                            isFree = kr?.flatrate?.some(p => normalizeProvider(p.provider_name) === 'Coupang Play') || false;

                            if (isFree) {
                                priceText = '와우 회원 무료';
                                priceVal = 0;
                            } else {
                                priceText = '개별구매';
                                priceVal = 5000;
                            }
                        } else {
                            // 서버 데이터가 불충분하면 JustWatch로 재확인 (백업)
                            try {
                                const jwUrl = `https://corsproxy.io/?${encodeURIComponent('https://www.justwatch.com/kr/검색?q=' + fullTitle)}`;
                                const jwRes = await fetch(jwUrl, { signal: AbortSignal.timeout(3000) });
                                if (jwRes.ok) {
                                    const jwHtml = await jwRes.text();
                                    if (jwHtml.includes('coupang-play')) {
                                        const cpSnip = jwHtml.substring(jwHtml.indexOf('coupang-play'), jwHtml.indexOf('coupang-play') + 600);
                                        isFree = cpSnip.includes('FLATRATE');
                                    }
                                }
                            } catch (e) {
                                // JustWatch 실패 시 TMDB로 판별
                                isFree = kr?.flatrate?.some(p => normalizeProvider(p.provider_name) === 'Coupang Play') || false;
                            }

                            if (isFree) {
                                priceText = '와우 회원 무료';
                                priceVal = 0;
                            }
                        }

                        providersMap.set('Coupang Play', {
                            name: 'Coupang Play',
                            texts: [priceText],
                            prices: [priceVal],
                            type: isFree ? 'subscription' : 'buy',
                            link: `https://www.coupangplay.com/query?src=page_search&keyword=${encodeURIComponent(fullTitle)}`
                        });
                    }
                }
            } catch (e) { }

            // Final consolidation
            providersMap.forEach((info, pName) => {
                const combinedText = info.texts.join(' / ');
                const lowestPrice = Math.min(...info.prices);

                // 중복 체크 로직 간소화: 제목과 OTT 이름이 같은 경우만 스킵
                const alreadyExists = finalResults.some(r =>
                    r.title.toLowerCase().replace(/\s/g, '') === fullTitle.toLowerCase().replace(/\s/g, '') &&
                    r.ott === pName
                );

                if (!alreadyExists) {
                    finalResults.push({
                        id: `res-v${Date.now()}-${item.id}-${pName.replace(/\s/g, '')}`,
                        title: fullTitle,
                        ott: pName,
                        price: lowestPrice,
                        priceText: combinedText,
                        image: item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : '',
                        description: item.overview ? item.overview.slice(0, 100) + '...' : '내용 설명이 없습니다.',
                        release_date: item.release_date || item.first_air_date || '0000-00-00',
                        link: info.link
                    });
                }
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
