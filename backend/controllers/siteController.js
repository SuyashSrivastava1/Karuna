const supabase = require('../config/supabase');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @desc    Get all disaster sites
// @route   GET /api/sites
const getSites = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('sites')
            .select('*')
            .order('urgency_score', { ascending: false });

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get single site by ID
// @route   GET /api/sites/:id
const getSiteById = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('sites')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Create a new site
// @route   POST /api/sites
const createSite = async (req, res) => {
    const { name, location, urgency_score, patient_count } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Site name is required' });
    }

    try {
        const { data, error } = await supabase
            .from('sites')
            .insert([{
                name,
                location: location || null,
                urgency_score: urgency_score || 0,
                patient_count: patient_count || 0,
                doctors_needed: 0,
                nurses_needed: 0,
                drivers_needed: 0
            }])
            .select();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a site (urgency, patient count, requirements)
// @route   PUT /api/sites/:id
const updateSite = async (req, res) => {
    const allowedFields = ['name', 'location', 'urgency_score', 'patient_count',
        'doctors_needed', 'nurses_needed', 'drivers_needed'];

    const updates = {};
    allowedFields.forEach(field => {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    try {
        const { data, error } = await supabase
            .from('sites')
            .update(updates)
            .eq('id', req.params.id)
            .select();

        if (error) throw error;
        res.status(200).json(data[0]);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Volunteer joins a site — triggers AI track assignment
// @route   POST /api/sites/:id/join
const joinSite = async (req, res) => {
    const siteId = req.params.id;
    const userId = req.user.id;

    try {
        // Get the user's profile for AI assignment
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (profileError) throw profileError;

        // If the user is a volunteer, run AI track assignment
        let assignment = null;
        if (profile.role === 'volunteer') {
            try {
                const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
                const prompt = `
          You are an AI coordinator for Karuna, a disaster relief platform.
          A volunteer is joining a site. Based on their profile, assign them to ONE track:
          1. NURSE — medical professionals (nurses, paramedics, medical students, pharmacists)
          2. DRIVER — people with vehicles or driving skills
          3. HELPER — general support, labor, cooking, teaching, logistics

          Volunteer profile:
          - Profession: ${profile.profession || 'Not specified'}
          - Vehicle availability: ${profile.vehicle_availability || 'None'}
          - Medical equipment: ${profile.medical_equipment || 'None'}
          - Medical fitness: ${profile.medical_fitness || 'Unknown'}
          - Disaster knowledge: ${profile.disaster_knowledge || 'None'}

          Return ONLY valid JSON: { "track": "NURSE|DRIVER|HELPER", "reason": "brief reason" }
        `;

                const result = await model.generateContent(prompt);
                const text = result.response.text().replace(/```json|```/g, '').trim();
                assignment = JSON.parse(text);
            } catch (aiError) {
                // Fallback: keyword-based assignment if AI fails
                console.error('AI assignment failed, using fallback:', aiError.message);
                const prof = (profile.profession || '').toLowerCase();
                const vehicle = (profile.vehicle_availability || '').toLowerCase();

                if (['nurse', 'paramedic', 'doctor', 'medical', 'pharmacist', 'emt'].some(k => prof.includes(k))) {
                    assignment = { track: 'NURSE', reason: 'Medical profession detected (fallback)' };
                } else if (vehicle && vehicle !== 'none' && vehicle !== 'no') {
                    assignment = { track: 'DRIVER', reason: 'Vehicle available (fallback)' };
                } else {
                    assignment = { track: 'HELPER', reason: 'General volunteer (fallback)' };
                }
            }
        }

        // Update user's current site and track
        const updateData = { current_site_id: siteId };
        if (assignment) {
            updateData.assigned_track = assignment.track;
            updateData.assignment_reason = assignment.reason;
        }

        const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', userId)
            .select();

        if (updateError) throw updateError;

        res.status(200).json({
            message: `Successfully joined site`,
            site_id: siteId,
            assignment: assignment,
            user: updatedUser[0]
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get live stats for a site (counts of volunteers by track)
// @route   GET /api/sites/:id/stats
const getSiteStats = async (req, res) => {
    try {
        const { data: site, error: siteError } = await supabase
            .from('sites')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (siteError) throw siteError;

        // Count volunteers at this site by track
        const { data: volunteers, error: volError } = await supabase
            .from('users')
            .select('assigned_track, role')
            .eq('current_site_id', req.params.id);

        if (volError) throw volError;

        const stats = {
            site_name: site.name,
            patient_count: site.patient_count,
            urgency_score: site.urgency_score,
            personnel: {
                doctors: volunteers.filter(v => v.role === 'doctor').length,
                pharmacies: volunteers.filter(v => v.role === 'pharmacy').length,
                nurses: volunteers.filter(v => v.assigned_track === 'NURSE').length,
                drivers: volunteers.filter(v => v.assigned_track === 'DRIVER').length,
                helpers: volunteers.filter(v => v.assigned_track === 'HELPER').length,
                total_volunteers: volunteers.length
            },
            needs: {
                doctors_needed: site.doctors_needed || 0,
                nurses_needed: site.nurses_needed || 0,
                drivers_needed: site.drivers_needed || 0
            }
        };

        res.status(200).json(stats);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    getSites,
    getSiteById,
    createSite,
    updateSite,
    joinSite,
    getSiteStats
};
