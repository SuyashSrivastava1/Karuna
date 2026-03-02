const { GoogleGenerativeAI } = require('@google/generative-ai');
const supabase = require('../config/supabase');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @desc    Assign volunteer track using AI
// @route   POST /api/volunteer/assign
const assignVolunteerTrack = async (req, res) => {
    const { profession, skills, vehicle_availability, medical_fitness,
        medical_equipment, availability_duration, disaster_knowledge, site_id } = req.body;

    if (!profession) {
        return res.status(400).json({ message: 'profession is required for AI assignment' });
    }

    try {
        let assignment;

        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

            const prompt = `
        You are an AI coordinator for Karuna, a disaster relief platform.
        Based on the following volunteer information, assign them to one of three tracks:
        1. NURSE: For medical professionals (nurses, paramedics, medical students, EMTs, pharmacists assisting on-site).
        2. DRIVER: For those with vehicles or driving skills (cars, trucks, bikes, ambulances).
        3. HELPER: For general support, manual labor, cooking, teaching, tent-making, or logistics.

        Volunteer Info:
        Profession: ${profession}
        Skills: ${skills || 'Not specified'}
        Vehicle availability: ${vehicle_availability || 'None'}
        Medical fitness: ${medical_fitness || 'Unknown'}
        Medical equipment owned: ${medical_equipment || 'None'}
        Available duration: ${availability_duration || 'Not specified'}
        Disaster management knowledge: ${disaster_knowledge || 'None'}

        Return ONLY valid JSON: { "track": "NURSE|DRIVER|HELPER", "reason": "brief reason", "suggested_tasks": ["task1", "task2", "task3"] }
      `;

            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            // Clean and parse the response
            const cleanedText = text.replace(/```json|```/g, '').trim();
            assignment = JSON.parse(cleanedText);
        } catch (aiError) {
            // Fallback: keyword-based assignment if AI fails
            console.error('Gemini AI failed, using fallback:', aiError.message);
            const prof = profession.toLowerCase();
            const vehicle = (vehicle_availability || '').toLowerCase();

            if (['nurse', 'paramedic', 'doctor', 'medical', 'emt', 'pharmacist', 'surgeon'].some(k => prof.includes(k))) {
                assignment = { track: 'NURSE', reason: 'Medical profession detected (fallback)', suggested_tasks: ['Attend to patients', 'Administer first aid', 'Coordinate with doctors'] };
            } else if (vehicle && vehicle !== 'none' && vehicle !== 'no') {
                assignment = { track: 'DRIVER', reason: 'Vehicle available (fallback)', suggested_tasks: ['Pick up supplies from pharmacy', 'Transport patients', 'Deliver donations'] };
            } else {
                assignment = { track: 'HELPER', reason: 'General volunteer (fallback)', suggested_tasks: ['Assist with setup', 'Distribute food and water', 'Help with crowd management'] };
            }
        }

        // Update user's role/track in Supabase
        const updateData = {
            assigned_track: assignment.track,
            assignment_reason: assignment.reason
        };
        if (site_id) updateData.current_site_id = site_id;

        const { data: userData, error: userError } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', req.user.id)
            .select();

        if (userError) throw userError;

        // Auto-create suggested todos if provided
        if (assignment.suggested_tasks && assignment.suggested_tasks.length > 0 && site_id) {
            const todos = assignment.suggested_tasks.map(task => ({
                site_id,
                user_id: req.user.id,
                task_description: task,
                status: 'pending'
            }));

            await supabase.from('volunteer_todos').insert(todos);
        }

        res.status(200).json({
            assignment,
            user: userData ? userData[0] : null
        });
    } catch (error) {
        console.error('Volunteer assignment error:', error);
        res.status(500).json({ message: 'Assignment failed', error: error.message });
    }
};

// @desc    Get current volunteer's assignment info
// @route   GET /api/volunteer/me
const getMyAssignment = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('assigned_track, assignment_reason, current_site_id')
            .eq('id', req.user.id)
            .single();

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    assignVolunteerTrack,
    getMyAssignment
};
