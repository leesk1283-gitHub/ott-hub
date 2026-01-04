const keys = [
    '8d9397435444b392230d922572566c82', // Current
    'f9f16618d3630f5407096d24660a9270', // Common tutorial key
    'a9d16a57530e38634860b29f0f9c2111',
    'c5478446960f277a06cc877e56212e3e'
];

async function check() {
    for (const key of keys) {
        console.log(`Checking key: ${key}...`);
        try {
            const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${key}&query=test`);
            if (res.status === 200) {
                console.log(`>>> VALID KEY FOUND: ${key}`);
            } else {
                console.log(`Status: ${res.status}`);
            }
        } catch (e) {
            console.log(`Error: ${e.message}`);
        }
    }
}

check();
