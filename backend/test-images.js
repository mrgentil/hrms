const axios = require('axios');

async function testImages() {
    const images = [
        'logo_light-1766695902837.png',
        'logo_dark-1766695891511.png',
        'favicon-1766695885263.png'
    ];

    for (const img of images) {
        const url = `http://localhost:3001/uploads/settings/${img}`;
        try {
            const response = await axios.head(url);
            console.log(`✅ SUCCESS: ${url} (Status: ${response.status})`);
        } catch (error) {
            console.log(`❌ FAILED: ${url} (Status: ${error.response ? error.response.status : error.message})`);
        }
    }
}

testImages();
