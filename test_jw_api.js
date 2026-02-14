import https from 'node:https';

const query = `
query GetSuggestedTitles($country: Country!, $language: Language!, $filter: TitleFilter) {
  popularTitles(country: $country, filter: $filter) {
    edges {
      node {
        content(country: $country, language: $language) {
          title
          ... on MovieContent {
            offers {
              monetizationType
              provider {
                shortName
                clearName
              }
            }
          }
          ... on ShowContent {
            offers {
               monetizationType
              provider {
                shortName
                clearName
              }
            }
          }
        }
      }
    }
  }
}
`;

const variables = {
    country: "KR",
    language: "ko",
    filter: { searchQuery: "나 홀로 집에" }
};

const postData = JSON.stringify({ query, variables });

const options = {
    hostname: 'apis.justwatch.com',
    path: '/graphql',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log(data);
    });
});

req.on('error', (e) => {
    console.error(e);
});

req.write(postData);
req.end();
