const { GoogleGenerativeAI } = require('@google/generative-ai');
const supabase = require('../config/supabase');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Indian emergency numbers
const EMERGENCY_NUMBERS = `
IMPORTANT EMERGENCY NUMBERS (India):
• National Emergency: 112
• Ambulance: 108
• Disaster Management (NDRF): 1078
• Fire: 101
• Police: 100
• Women Helpline: 1091
• Child Helpline: 1098
`;

// @desc    Emergency Chatbot (supports multi-turn conversation)
// @route   POST /api/chatbot/chat
const chatWithAI = async (req, res) => {
    const { message, context, history } = req.body;

    if (!message) {
        return res.status(400).json({ message: 'message is required' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        // Fetch active sites for context
        let sitesContext = '';
        try {
            const { data: sites } = await supabase
                .from('sites')
                .select('name, location, urgency_score, patient_count')
                .order('urgency_score', { ascending: false })
                .limit(5);

            if (sites && sites.length > 0) {
                sitesContext = '\n\nActive Relief Sites:\n' + sites.map(s =>
                    `• ${s.name} (${s.location || 'Location unknown'}) — Urgency: ${s.urgency_score}/10, Patients: ${s.patient_count}`
                ).join('\n');
            }
        } catch (e) {
            // Non-critical — continue without site context
        }

        const systemPrompt = `
      You are the Karuna Emergency Assistant — a disaster relief chatbot.
      Your goal is to provide immediate, clear, and calm advice during a disaster.
      
      ${EMERGENCY_NUMBERS}
      ${sitesContext}

      RULES:
      1. ALWAYS provide relevant emergency phone numbers in your first response.
      2. Provide immediate safety steps based on the disaster type.
      3. If the user seems to be in immediate danger, prioritize evacuation instructions.
      4. Suggest the nearest active relief sites when applicable.
      5. Keep responses concise and use bullet points for readability.
      6. Use simple, non-technical language (the user may be panicking).
      7. Always end with: "Stay calm. Help is on the way."
    `;

        // Build conversation with history for multi-turn support
        let contents = [];

        if (history && Array.isArray(history) && history.length > 0) {
            // Add conversation history
            history.forEach(msg => {
                contents.push({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }]
                });
            });
        }

        // Add current message
        const currentMessage = context
            ? `[Context: ${context}] ${message}`
            : message;

        contents.push({
            role: 'user',
            parts: [{ text: currentMessage }]
        });

        const result = await model.generateContent({
            contents,
            systemInstruction: { parts: [{ text: systemPrompt }] }
        });

        const text = result.response.text();

        res.status(200).json({
            response: text,
            emergency_numbers: {
                national: '112',
                ambulance: '108',
                ndrf: '1078',
                fire: '101',
                police: '100'
            }
        });
    } catch (error) {
        console.error('Chatbot AI Error:', error);

        // Even if AI fails, always return emergency numbers
        res.status(200).json({
            response: `I'm having trouble connecting right now, but here are your emergency numbers:\n${EMERGENCY_NUMBERS}\n\nStay calm. Help is on the way.`,
            emergency_numbers: {
                national: '112',
                ambulance: '108',
                ndrf: '1078',
                fire: '101',
                police: '100'
            },
            ai_error: true
        });
    }
};

module.exports = {
    chatWithAI
};
