
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

async function testEndpoints() {
    const endpoints = [
        '/performance/recognitions/feed',
        '/performance/recognitions/my',
        '/performance/recognitions/leaderboard?period=month&limit=10',
        '/performance/recognitions/badges',
        '/employees?limit=1000'
    ];

    for (const endpoint of endpoints) {
        try {
            console.log(`Testing ${endpoint}...`);
            const response = await axios.get(`${API_BASE_URL}${endpoint}`);
            console.log(`Success: ${endpoint} - ${response.status}`);
        } catch (error: any) {
            console.log(`Error: ${endpoint} - ${error.response?.status} - ${JSON.stringify(error.response?.data)}`);
        }
    }
}

testEndpoints();
