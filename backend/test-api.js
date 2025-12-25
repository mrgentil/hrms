const axios = require('axios');

async function testApi() {
    try {
        const response = await axios.get('http://localhost:3001/settings/public');
        console.log('API Response:', JSON.stringify(response.data, null, 2));
    } catch (e) {
        console.error('API Error:', e.message);
        if (e.response) {
            console.error('Status:', e.response.status);
            console.error('Data:', e.response.data);
        }
    }
}

testApi();
