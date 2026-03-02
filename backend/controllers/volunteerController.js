const { GoogleGenerativeAI } = require('@google/generative-ai');
const supabase = require('../config/supabase');

const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

// @desc    Assign volunteer track using AI
// @route   POST /api/volunteer/assign
const assignVolunteerTrack = async (req, res) => {
    const { profession, skills, vehicle_availability, medical_fitness,
        medical_equipment, availability_duration, disaster_knowledge, site_id } = req.body;

    if (!profession || !profession.trim()) {
        return res.status(400).json({ message: 'profession is required for AI assignment' });
    }

    try {
        let assignment;

        if (genAI) {
            try {
                const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

                // Truncate user inputs to prevent prompt injection via very long strings
                const prompt = `
          You are an AI coordinator for Karuna, a disaster relief platform.
          Assign volunteer to one of three tracks:
          1. NURSE: Medical professionals.
          2. DRIVER: Those with vehicles.
          3. HELPER: General support.

          Volunteer Info:
          Profession: ${(profession || '').substring(0, 100)}
          Skills: ${(skills || 'Not specified').substring(0, 200)}
          Vehicle: ${(vehicle_availability || 'None').substring(0, 50)}
          Medical fitness: ${medical_fitness || 'Unknown'}
          Equipment: ${(medical_equipment || 'None').substring(0, 100)}
          Duration: ${(availability_duration || 'Not specified').substring(0, 50)}
          Disaster knowledge: ${(disaster_knowledge || 'None').substring(0, 50)}

          Return ONLY valid JSON: { "track": "NURSE|DRIVER|HELPER", "reason": "brief reason", "suggested_tasks": ["task1", "task2", "task3"] }
        `;

                const result = await model.generateContent(prompt);
                const text = result.response.text().replace(/```json|```/g, '').trim();
                assignment = JSON.parse(text);

                // Validate AI output
                if (!['NURSE', 'DRIVER', 'HELPER'].includes(assignment.track)) {
                    throw new Error('AI returned invalid track');
                }
                if (!Array.isArray(assignment.suggested_tasks)) {
                    assignment.suggested_tasks = [];
                }
            } catch (aiError) {
                console.error('Gemini AI failed, using fallback:', aiError.message);
                assignment = null;
            }
        }

        // Keyword fallback
        if (!assignment) {
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

        // Update user
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

        // Auto-create suggested todos — guard against non-array
        if (Array.isArray(assignment.suggested_tasks) && assignment.suggested_tasks.length > 0 && site_id) {
            const todos = assignment.suggested_tasks
                .filter(task => typeof task === 'string' && task.trim())
                .slice(0, 10) // Cap at 10 tasks
                .map(task => ({
                    site_id,
                    user_id: req.user.id,
                    task_description: task.trim().substring(0, 500),
                    status: 'pending'
                }));

            if (todos.length > 0) {
                await supabase.from('volunteer_todos').insert(todos);
            }
        }

        res.status(200).json({
            assignment,
            user: userData && userData[0] ? userData[0] : null
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

        if (error || !data) {
            return res.status(404).json({ message: 'No assignment found' });
        }
        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { assignVolunteerTrack, getMyAssignment };
