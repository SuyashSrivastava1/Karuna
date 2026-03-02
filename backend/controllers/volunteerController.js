const { GoogleGenerativeAI } = require('@google/generative-ai');
const supabase = require('../config/supabase');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @desc    Assign volunteer track using AI
// @route   POST /api/volunteer/assign
const assignVolunteerTrack = async (req, res) => {
    const { profession, skills, vehicle_availability } = req.body;

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const prompt = `
      You are an AI coordinator for Karuna, a disaster relief platform.
      Based on the following volunteer information, assign them to one of three tracks:
      1. NURSE: For medical professionals (nurses, paramedics, medical students).
      2. DRIVER: For those with vehicles or driving skills (cars, trucks, bikes).
      3. HELPER: For general support, manual labor, or teaching.

      Volunteer Info:
      Profession: ${profession}
      Skills: ${skills}
      Vehicle: ${vehicle_availability}

      Return only the track name (NURSE, DRIVER, or HELPER) and a brief reason.
      Format: JSON { "track": "TRACK_NAME", "reason": "REASON" }
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean and parse the response
        const cleanedText = text.replace(/```json|```/g, '').trim();
        const assignment = JSON.parse(cleanedText);

        // Update user's role/track in Supabase
        const { data: userData, error: userError } = await supabase
            .from('users')
            .update({
                assigned_track: assignment.track,
                assignment_reason: assignment.reason
            })
            .eq('id', req.user.id)
            .select();

        if (userError) throw userError;

        res.status(200).json(assignment);
    } catch (error) {
        console.error('Gemini AI Error:', error);
        res.status(500).json({ message: 'AI assignment failed', error: error.message });
    }
};

module.exports = {
    assignVolunteerTrack
};
