/**
 * OTT Search Service (Smart Real-Time + Multi-Source Price Verification)
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

        // 1. Spacing Fallback
        if (!queryClean.includes(' ') && queryClean.length >= 2) {
            const fallbackQuery = queryClean.slice(0, Math.floor(queryClean.length / 2)) + ' ' + queryClean.slice(Math.floor(queryClean.length / 2));
            const fRes = await fetch(`${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(fallbackQuery)}&language=ko-KR&page=1`);
            const fData = await fRes.json();
            if (fData.results) {
                const existingIds = new Set((searchData.results || []).map(r => r.id));
                fData.results.forEach(r => { if (!existingIds.has(r.id)) searchData.results.push(r); });
            }
        }

        if (!searchData.results) return [];

        const itemsToProcess = [...searchData.results.slice(0, 16)];
        const processedCollectionIds = new Set();

        // 2. Collection Expansion
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
                                const isSub = cat === 'flatrate';
                                providersMap.set(pName, {
                                    name: pName,
                                    texts: [isSub ? '구독(무료)' : `개별구매(확인필요)`],
                                    prices: [isSub ? 0 : 99999],
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

            // C. Coupang Play - Smart Real-Time Scraper (V5)
            try {
                if (!providersMap.has('Coupang Play')) {
                    // Check presence via JustWatch
                    const jwUrl = `https://corsproxy.io/?${encodeURIComponent('https://www.justwatch.com/kr/검색?q=' + fullTitle)}`;
                    const jwRes = await fetch(jwUrl);
                    if (jwRes.ok) {
                        const jwHtml = await jwRes.text();
                        if (jwHtml.includes('coupang-play')) {
                            // Existence confirmed.
                            let cpPriceStr = "개별구매(가격 확인 중)";
                            let cpPriceVal = 5000;
                            let isStore = true; // Default to store if ambiguous to avoid false-free

                            // Stage 1: Search Naver for exact Real-time Price
                            try {
                                const naverUrl = `https://search.naver.com/search.naver?query=${encodeURIComponent(fullTitle + " 가격 정보")}`;
                                const navRes = await fetch(`https://corsproxy.io/?${encodeURIComponent(naverUrl)}`);
                                if (navRes.ok) {
                                    const navHtml = await navRes.text();
                                    const cpIdx = navHtml.indexOf('쿠팡플레이');
                                    if (cpIdx !== -1) {
                                        const context = navHtml.substring(cpIdx - 20, cpIdx + 300);
                                        const pm = context.match(/([0-9,]{3,})\s?원/);
                                        if (pm) {
                                            const pVal = parseInt(pm[1].replace(/,/g, ''));
                                            if (pVal > 0 && pVal < 40000) {
                                                cpPriceStr = `개별구매 ${pVal.toLocaleString()}원`;
                                                cpPriceVal = pVal;
                                                isStore = true;
                                            }
                                        } else if (context.includes('무료') || context.includes('와우')) {
                                            // Only label free if Naver explicitly says so and no price is found
                                            cpPriceStr = '와우 회원 무료';
                                            cpPriceVal = 0;
                                            isStore = false;
                                        }
                                    }
                                }
                            } catch (e) { }

                            // Stage 2: Final UI Fallback (Never show "Free" unless 100% sure)
                            if (cpPriceStr.includes('확인 중')) {
                                // If JustWatch doesn't explicitly have FLATRATE marker in snippet, assume Store
                                const snippet = jwHtml.substring(jwHtml.indexOf('coupang-play'), jwHtml.indexOf('coupang-play') + 500);
                                if (snippet.includes('FLATRATE') && !fullTitle.includes('2') && !fullTitle.includes('3')) {
                                    cpPriceStr = "와우 회원 무료";
                                    cpPriceVal = 0;
                                    isStore = false;
                                } else {
                                    cpPriceStr = "개별구매(앱에서 확인)";
                                    isStore = true;
                                }
                            }

                            providersMap.set('Coupang Play', {
                                name: 'Coupang Play',
                                texts: [cpPriceStr],
                                prices: [cpPriceVal],
                                type: isStore ? 'buy' : 'subscription',
                                link: `https://www.coupangplay.com/query?src=page_search&keyword=${encodeURIComponent(fullTitle)}`
                            });
                        }
                    }
                }
            } catch (e) { }

            // Final consolidation
            providersMap.forEach((info, pName) => {
                const combinedText = info.texts.join(' / ');
                const lowestPrice = Math.min(...info.prices);

                if (!finalResults.some(r => r.title === fullTitle && r.ott === pName)) {
                    finalResults.push({
                        id: `res-v5-${item.id}-${pName}`,
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
