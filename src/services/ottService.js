/**
 * OTT Search Service (Smart Real-Time + Premium Pricing + Multi-Source Discovery)
 */

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w200';
const TMDB_API_KEY = 'eb11bb474eef7856758589fb09e65c29';

const RAPID_API_KEY = 'fdd47c2553mshd19015530c43e2cp1a9d7djsn31c6ad035190';
const RAPID_API_HOST = 'streaming-availability.p.rapidapi.com';

// Targeted Correction Layer (Removed manual patches as requested for real-time accuracy)
const KR_DATA_PATCHES = {};

/**
 * Fetch streaming data from Streaming Availability API via TMDB ID
 */
async function fetchByTmdbId(tmdbId, mediaType) {
    try {
        const url = `https://${RAPID_API_HOST}/shows/${mediaType}/${tmdbId}?country=kr`;
        const res = await fetch(url, {
            method: 'GET',
            headers: { 'X-RapidAPI-Key': RAPID_API_KEY, 'X-RapidAPI-Host': RAPID_API_HOST }
        });
        if (res.status === 200) {
            return await res.json();
        }
    } catch (e) {
        console.warn(`TMDB ID Lookup failed for ${tmdbId}:`, e);
    }
    return null;
}

export const searchOTT = async (query) => {
    if (!query || !TMDB_API_KEY) return [];

    const queryClean = query.trim();
    const queryNoSpace = queryClean.replace(/\s/g, '').toLowerCase();

    // Normalize provider names for consistency
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

    // Generate direct search links for each provider
    const getProviderSearchLink = (providerName, title) => {
        const encodedTitle = encodeURIComponent(title);
        const providerLinks = {
            'Netflix': `https://www.netflix.com/search?q=${encodedTitle}`,
            'Disney+': `https://www.disneyplus.com/search?q=${encodedTitle}`,
            'Coupang Play': `https://www.coupangplay.com/query?src=page_search&keyword=${encodedTitle}`,
            'Watcha': `https://watcha.com/search?query=${encodedTitle}`,
            'wavve': `https://www.wavve.com/search?searchWord=${encodedTitle}`,
            'Apple TV': `https://tv.apple.com/kr/search?term=${encodedTitle}`,
            'Google Play Movies': `https://play.google.com/store/search?q=${encodedTitle}&c=movies`,
            'TVING': `https://www.tving.com/search?keyword=${encodedTitle}`,
            'Amazon Prime Video': `https://www.primevideo.com/search?phrase=${encodedTitle}`,
            'Naver Store': `https://m.series.naver.com/search/search.series?keyword=${encodedTitle}`,
        };
        return providerLinks[providerName] || null;
    };

    try {
        let searchRes = await fetch(`${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(queryClean)}&language=ko-KR&page=1`);
        if (!searchRes.ok) return [];
        let searchData = await searchRes.json();

        // 1.1 Smart Spacing Fallback
        if (!queryClean.includes(' ') && queryClean.length >= 2) {
            const fallbackResults = [];
            for (let i = 1; i < queryClean.length; i++) {
                const fq = queryClean.slice(0, i) + ' ' + queryClean.slice(i);
                try {
                    const fRes = await fetch(`${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(fq)}&language=ko-KR&page=1`);
                    const fData = await fRes.json();
                    if (fData.results) fallbackResults.push(...fData.results);
                } catch (err) { }
            }
            if (fallbackResults.length > 0) {
                if (!searchData.results) searchData.results = [];
                const existingIds = new Set(searchData.results.map(r => r.id));
                fallbackResults.forEach(r => {
                    if (!existingIds.has(r.id)) {
                        searchData.results.push(r);
                        existingIds.add(r.id);
                    }
                });
            }
        }

        if (!searchData.results) return [];

        let itemsToProcess = [...searchData.results.slice(0, 16)];
        const processedCollectionIds = new Set();

        // 2. Collection Expansion
        for (const item of searchData.results.slice(0, 4)) {
            if (item.media_type === 'movie') {
                try {
                    const detailRes = await fetch(`${TMDB_BASE_URL}/movie/${item.id}?api_key=${TMDB_API_KEY}&language=ko-KR`);
                    const details = await detailRes.json();
                    if (details.belongs_to_collection && !processedCollectionIds.has(details.belongs_to_collection.id)) {
                        const cId = details.belongs_to_collection.id;
                        processedCollectionIds.add(cId);
                        const cRes = await fetch(`${TMDB_BASE_URL}/collection/${cId}?api_key=${TMDB_API_KEY}&language=ko-KR`);
                        const cData = await cRes.json();
                        if (cData.parts) {
                            cData.parts.forEach(part => {
                                if (!itemsToProcess.some(it => it.id === part.id)) {
                                    itemsToProcess.push({ ...part, media_type: 'movie' });
                                }
                            });
                        }
                    }
                } catch (e) { }
            }
        }

        const finalResults = [];
        const priorityItems = itemsToProcess.slice(0, 15);

        for (const item of priorityItems) {
            const type = item.media_type || 'movie';
            const fullTitle = item.title || item.name;
            const originalTitle = item.original_title || item.original_name || '';
            const titleKey = fullTitle.toLowerCase().replace(/\s/g, '');
            const originalKey = originalTitle.toLowerCase().replace(/\s/g, '');

            if (queryClean.length >= 3 && !titleKey.includes(queryNoSpace) && !originalKey.includes(queryNoSpace)) {
                continue;
            }

            let providersMap = new Map();

            // A. Premium API
            const deepData = await fetchByTmdbId(item.id, type);
            if (deepData && deepData.streamingOptions?.kr) {
                deepData.streamingOptions.kr.forEach(opt => {
                    const providerName = normalizeProvider(opt.service?.name || opt.service?.id || '알 수 없음');
                    let priceVal = opt.price ? parseInt(opt.price.amount) : 0;
                    let priceText = opt.price
                        ? `${opt.type === 'buy' ? '구매 ' : '대여 '}${priceVal.toLocaleString()}원`
                        : (opt.type === 'subscription' ? '구독(무료)' : (opt.type === 'free' ? '무료' : '확인 필요'));

                    if (!providersMap.has(providerName)) {
                        providersMap.set(providerName, {
                            name: providerName,
                            texts: [priceText],
                            prices: [priceVal],
                            type: opt.type,
                            link: opt.link
                        });
                    } else {
                        const existing = providersMap.get(providerName);
                        if (!existing.texts.includes(priceText)) {
                            existing.texts.push(priceText);
                            existing.prices.push(priceVal);
                        }
                    }
                });
            }

            // B. TMDB Watch Providers
            try {
                const wpRes = await fetch(`${TMDB_BASE_URL}/${type}/${item.id}/watch/providers?api_key=${TMDB_API_KEY}`);
                const wpData = await wpRes.json();
                const kr = wpData.results?.KR;
                if (kr) {
                    ['flatrate', 'buy', 'rent'].forEach(cat => {
                        if (kr[cat]) {
                            kr[cat].forEach(p => {
                                const pName = normalizeProvider(p.provider_name);
                                if (!providersMap.has(pName)) {
                                    const directLink = getProviderSearchLink(pName, fullTitle);
                                    providersMap.set(pName, {
                                        name: pName,
                                        texts: [cat === 'flatrate' ? '구독(무료)' : `앱에서 확인(${cat === 'buy' ? '구매' : '대여'})`],
                                        prices: [cat === 'flatrate' ? 0 : 99999],
                                        type: cat,
                                        link: directLink || kr.link
                                    });
                                }
                            });
                        }
                    });
                }
            } catch (e) { }

            // C. Coupang Play Discovery (NEW: Store vs Free Corrected)
            try {
                const itemIndex = priorityItems.indexOf(item);
                if (itemIndex < 10 && !providersMap.has('Coupang Play')) {
                    // Check search result for markers
                    const cpSearchUrl = `https://www.coupangplay.com/query?src=page_search&keyword=${encodeURIComponent(fullTitle)}`;
                    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(cpSearchUrl)}`;
                    const cpRes = await fetch(proxyUrl);
                    if (cpRes.ok) {
                        const html = await cpRes.text();
                        // Marker that CP has this item at all
                        if (html.includes('스토어') || html.includes('와우') || html.includes('titles') || html.includes('play')) {

                            // Highly reliable Store Detection
                            // In Coupang search source, Store items are clearly separated by "스토어" or "개별구매" strings
                            let cpPriceStr = "앱에서 확인";
                            let cpPriceVal = 5000;
                            let isStore = html.toLowerCase().includes('스토어') || html.includes('개별구매') || html.includes('badge_buy');

                            // Extraction via Naver for precise pricing if detected as store
                            try {
                                const naverUrl = `https://search.naver.com/search.naver?query=${encodeURIComponent(fullTitle + " 쿠팡플레이 개별구매")}`;
                                const navRes = await fetch(`https://corsproxy.io/?${encodeURIComponent(naverUrl)}`);
                                if (navRes.ok) {
                                    const navHtml = await navRes.text();
                                    const bodyIdx = navHtml.indexOf('<body');
                                    const bodyText = bodyIdx !== -1 ? navHtml.substring(bodyIdx) : navHtml;

                                    const cpIdx = bodyText.indexOf('쿠팡플레이');
                                    if (cpIdx !== -1) {
                                        const context = bodyText.substring(cpIdx - 50, cpIdx + 300);
                                        const priceMatch = context.match(/([0-9,]{3,})\s?원/);
                                        if (priceMatch) {
                                            const pVal = parseInt(priceMatch[1].replace(/,/g, ''));
                                            if (pVal > 100 && pVal < 30000) {
                                                cpPriceStr = `개별구매 ${pVal.toLocaleString()}원`;
                                                cpPriceVal = pVal;
                                                isStore = true;
                                            }
                                        }
                                    }
                                }
                            } catch (e) { }

                            // If No store indicators and JustWatch says FLATRATE, then it's free
                            if (cpPriceStr === "앱에서 확인") {
                                const jwSearchUrl = `https://www.justwatch.com/kr/검색?q=${encodeURIComponent(fullTitle)}`;
                                const jwRes = await fetch(`https://corsproxy.io/?${encodeURIComponent(jwSearchUrl)}`);
                                if (jwRes.ok) {
                                    const jwHtml = await jwRes.text();
                                    if (jwHtml.includes('coupang-play')) {
                                        const cpIdx = jwHtml.indexOf('coupang-play');
                                        const snippet = jwHtml.substring(cpIdx, cpIdx + 500);
                                        if (snippet.includes('FLATRATE')) {
                                            cpPriceStr = '와우 회원 무료';
                                            cpPriceVal = 0;
                                            isStore = false;
                                        } else if (snippet.includes('BUY') || snippet.includes('RENT')) {
                                            isStore = true;
                                            cpPriceStr = '와우 회원 전용(구매)';
                                        }
                                    }
                                }
                            }

                            if (!providersMap.has('Coupang Play')) {
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
                }
            } catch (e) { }

            // Final consolidation and push
            providersMap.forEach((info, pName) => {
                const combinedText = info.texts.join(' / ');
                const lowestPrice = Math.min(...info.prices);

                if (!finalResults.some(r => r.title === fullTitle && r.ott === pName)) {
                    let pText = combinedText;
                    let note = null;

                    if (pText.length > 35 && (pText.includes('광고') || pText.includes('제한') || pText.includes('라이선스'))) {
                        note = '광고형 멤버십 제외';
                        pText = '구독(무료)';
                    }

                    finalResults.push({
                        id: `res-prec-${item.id}-${pName}`,
                        title: fullTitle,
                        ott: pName,
                        price: lowestPrice,
                        priceText: pText,
                        image: item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : '',
                        description: item.overview ? item.overview.slice(0, 100) + '...' : '내용 설명이 없습니다.',
                        release_date: item.release_date || item.first_air_date || '0000-00-00',
                        link: info.link,
                        note: note
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
        console.error("Search API Error:", error);
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
