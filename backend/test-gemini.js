const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI('AIzaSyDkv2msFUg14Ez9erwTS_-yRBCxSDwFFfM');

async function listModels() {
    try {
        console.log('Testing Gemini API...\n');

        // Try to use a simple model
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const prompt = 'Hello, just testing. Reply with: OK';
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('✅ Success! Model "gemini-pro" is working!');
        console.log('Response:', text);
    } catch (error) {
        console.error('❌ Error with gemini-pro:', error.message);

        // Try gemini-1.5-flash
        try {
            console.log('\nTrying gemini-1.5-flash...');
            const model2 = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const result2 = await model2.generateContent('Hello');
            console.log('✅ gemini-1.5-flash works!');
        } catch (error2) {
            console.error('❌ Error with gemini-1.5-flash:', error2.message);
        }
    }
}

listModels();
