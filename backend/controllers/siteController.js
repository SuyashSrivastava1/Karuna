const supabase = require('../config/supabase');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

// @desc    Get all disaster sites
// @route   GET /api/sites
const getSites = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('sites')
            .select('*')
            .order('urgency_score', { ascending: false });

        if (error) throw error;
        res.status(200).json(data || []);
    } catch (error) {
        res.status(500).json({ message: error.message });
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

        if (error || !data) {
            return res.status(404).json({ message: 'Site not found' });
        }
        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Create a new site
// @route   POST /api/sites
const createSite = async (req, res) => {
    const { name, location, latitude, longitude, urgency_score, patient_count } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Site name is required' });
    }

    // Validate numeric ranges
    if (urgency_score !== undefined && (urgency_score < 0 || urgency_score > 10)) {
        return res.status(400).json({ message: 'urgency_score must be between 0 and 10' });
    }
    if (patient_count !== undefined && patient_count < 0) {
        return res.status(400).json({ message: 'patient_count cannot be negative' });
    }
    // Validate GPS coordinates if provided
    if (latitude !== undefined && (latitude < -90 || latitude > 90)) {
        return res.status(400).json({ message: 'latitude must be between -90 and 90' });
    }
    if (longitude !== undefined && (longitude < -180 || longitude > 180)) {
        return res.status(400).json({ message: 'longitude must be between -180 and 180' });
    }

    try {
        const { data, error } = await supabase
            .from('sites')
            .insert([{
                name: name.trim(),
                location: location || null,
                latitude: latitude || null,
                longitude: longitude || null,
                urgency_score: urgency_score || 0,
                patient_count: patient_count || 0,
                doctors_needed: 0,
                nurses_needed: 0,
                drivers_needed: 0
            }])
            .select();

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a site
// @route   PUT /api/sites/:id
const updateSite = async (req, res) => {
    const allowedFields = ['name', 'location', 'latitude', 'longitude', 'urgency_score',
        'patient_count', 'doctors_needed', 'nurses_needed', 'drivers_needed'];

    const updates = {};
    allowedFields.forEach(field => {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'No valid fields provided to update' });
    }

    // Validate ranges
    if (updates.urgency_score !== undefined && (updates.urgency_score < 0 || updates.urgency_score > 10)) {
        return res.status(400).json({ message: 'urgency_score must be between 0 and 10' });
    }
    if (updates.patient_count !== undefined && updates.patient_count < 0) {
        return res.status(400).json({ message: 'patient_count cannot be negative' });
    }

    try {
        // Verify site exists first
        const { data: existing } = await supabase.from('sites').select('id').eq('id', req.params.id).single();
        if (!existing) {
            return res.status(404).json({ message: 'Site not found' });
        }

        if (updates.name) updates.name = updates.name.trim();

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
        // Verify site exists
        const { data: site, error: siteError } = await supabase
            .from('sites')
            .select('id, name')
            .eq('id', siteId)
            .single();

        if (siteError || !site) {
            return res.status(404).json({ message: 'Site not found' });
        }

        // Get the user's profile
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (profileError || !profile) {
            return res.status(404).json({ message: 'User profile not found. Please complete registration.' });
        }

        // Check if user is already at this site
        if (profile.current_site_id && String(profile.current_site_id) === String(siteId)) {
            return res.status(409).json({ message: 'You are already assigned to this site' });
        }

        // Save volunteer extra fields from the join form
        const volunteerFields = {};
        const joinFields = ['vehicle_availability', 'medical_equipment', 'medical_fitness',
            'availability_duration', 'disaster_knowledge'];
        joinFields.forEach(f => {
            if (req.body[f] !== undefined) volunteerFields[f] = req.body[f];
        });

        // Persist the join-form fields first
        if (Object.keys(volunteerFields).length > 0) {
            await supabase.from('users').update(volunteerFields).eq('id', userId);
            // Merge into profile for AI prompt below
            Object.assign(profile, volunteerFields);
        }

        // AI track assignment for volunteers
        let assignment = null;
        if (profile.role === 'volunteer') {
            if (genAI) {
                try {
                    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
                    const prompt = `
            You are an AI coordinator for Karuna, a disaster relief platform.
            A volunteer is joining a site. Based on their profile, assign them to ONE track:
            1. NURSE — medical professionals (nurses, paramedics, medical students, pharmacists)
            2. DRIVER — people with vehicles or driving skills
            3. HELPER — general support, labor, cooking, teaching, logistics

            Volunteer profile:
            - Profession: ${(profile.profession || 'Not specified').substring(0, 100)}
            - Vehicle availability: ${(profile.vehicle_availability || 'None').substring(0, 50)}
            - Medical equipment: ${(profile.medical_equipment || 'None').substring(0, 100)}
            - Medical fitness: ${profile.medical_fitness || 'Unknown'}
            - Disaster knowledge: ${(profile.disaster_knowledge || 'None').substring(0, 50)}

            Return ONLY valid JSON: { "track": "NURSE|DRIVER|HELPER", "reason": "brief reason" }
          `;

                    const result = await model.generateContent(prompt);
                    const text = result.response.text().replace(/```json|```/g, '').trim();
                    assignment = JSON.parse(text);

                    // Validate AI returned a valid track
                    if (!['NURSE', 'DRIVER', 'HELPER'].includes(assignment.track)) {
                        throw new Error('AI returned invalid track');
                    }
                } catch (aiError) {
                    console.error('AI assignment failed, using fallback:', aiError.message);
                    assignment = null; // fall through to keyword fallback
                }
            }

            // Keyword fallback if AI is unavailable or failed
            if (!assignment) {
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

        // Update user record
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
            message: `Successfully joined ${site.name}`,
            site_id: siteId,
            assignment,
            user: updatedUser && updatedUser[0] ? updatedUser[0] : null
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get live stats for a site
// @route   GET /api/sites/:id/stats
const getSiteStats = async (req, res) => {
    try {
        const { data: site, error: siteError } = await supabase
            .from('sites')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (siteError || !site) {
            return res.status(404).json({ message: 'Site not found' });
        }

        const { data: volunteers, error: volError } = await supabase
            .from('users')
            .select('assigned_track, role')
            .eq('current_site_id', req.params.id);

        if (volError) throw volError;

        const vols = volunteers || [];
        const stats = {
            site_name: site.name,
            patient_count: site.patient_count,
            urgency_score: site.urgency_score,
            personnel: {
                doctors: vols.filter(v => v.role === 'doctor').length,
                pharmacies: vols.filter(v => v.role === 'pharmacy').length,
                nurses: vols.filter(v => v.assigned_track === 'NURSE').length,
                drivers: vols.filter(v => v.assigned_track === 'DRIVER').length,
                helpers: vols.filter(v => v.assigned_track === 'HELPER').length,
                total: vols.length
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

module.exports = { getSites, getSiteById, createSite, updateSite, joinSite, getSiteStats };
