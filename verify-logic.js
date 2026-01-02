import { searchOTT } from './src/services/ottService.js';

// Mock fetch for global scope in Node environment if needed, 
// but since I'm testing the logic and it uses fetch, 
// I'll just check if it imports okay and the logic seems sound.
// Actually, I'll just do a dry run of the sorting/filtering logic by mocking some data.

const mockResults = [
    { title: '최악의 악', release_date: '2023-09-27' },
    { title: '최악의 허니문', release_date: '2020-01-01' },
    { title: '나 홀로 집에 3', release_date: '1997-12-12' }
];

const query = '최악의 악';
const queryNoSpace = query.replace(/\s/g, '').toLowerCase();

const filtered = mockResults.filter(item => {
    const titleKey = item.title.toLowerCase().replace(/\s/g, '');
    return titleKey.includes(queryNoSpace);
});

const sorted = filtered.sort((a, b) => {
    const aMatch = a.title.replace(/\s/g, '').toLowerCase() === queryNoSpace;
    const bMatch = b.title.replace(/\s/g, '').toLowerCase() === queryNoSpace;
    if (aMatch && !bMatch) return -1;
    if (!aMatch && bMatch) return 1;
    return a.title.localeCompare(b.title);
});

console.log("Query:", query);
console.log("Result:", sorted[0].title); // Should be '최악의 악'
if (sorted.length > 1) {
    console.log("Second:", sorted[1].title);
}
