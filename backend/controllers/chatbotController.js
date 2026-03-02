const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @desc    Emergency Chatbot
// @route   POST /api/chatbot/chat
const chatWithAI = async (req, res) => {
    const { message, context } = req.body;

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const prompt = `
      You are the Karuna Emergency Assistant. 
      Your goal is to provide immediate, clear, and calm advice during a disaster.
      
      User message: "${message}"
      Site/Current Context: ${context || 'General Disaster Zone'}

      Instructions:
      1. Provide immediate safety steps.
      2. Suggest nearby safe zones if applicable.
      3. Keep it brief and high-contrast (use bullet points).
      4. Always end with: "Stay calm. Help is on the way."
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({ response: text });
    } catch (error) {
        console.error('Chatbot AI Error:', error);
        res.status(500).json({ message: 'Chatbot failed', error: error.message });
    }
};

module.exports = {
    chatWithAI
};
