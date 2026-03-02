const supabase = require('../config/supabase');

// @desc    Get patient tags for a site
// @route   GET /api/patients/:siteId
const getPatientTags = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('patient_tags')
            .select('*')
            .eq('site_id', req.params.siteId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Create a patient tag
// @route   POST /api/patients
const createPatientTag = async (req, res) => {
    const { site_id, patient_id, triage_level, notes } = req.body;

    if (!site_id || !patient_id) {
        return res.status(400).json({ message: 'site_id and patient_id are required' });
    }

    const validLevels = ['Urgent', 'Moderate', 'Stable'];
    if (triage_level && !validLevels.includes(triage_level)) {
        return res.status(400).json({ message: `triage_level must be one of: ${validLevels.join(', ')}` });
    }

    try {
        const { data, error } = await supabase
            .from('patient_tags')
            .insert([{
                site_id,
                patient_id,
                triage_level: triage_level || 'Stable',
                notes: notes || null,
                created_by: req.user.id
            }])
            .select();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update patient tag (triage level, notes)
// @route   PUT /api/patients/:id
const updatePatientTag = async (req, res) => {
    const { triage_level, notes } = req.body;

    const validLevels = ['Urgent', 'Moderate', 'Stable'];
    if (triage_level && !validLevels.includes(triage_level)) {
        return res.status(400).json({ message: `triage_level must be one of: ${validLevels.join(', ')}` });
    }

    try {
        const updateData = {};
        if (triage_level) updateData.triage_level = triage_level;
        if (notes !== undefined) updateData.notes = notes;

        const { data, error } = await supabase
            .from('patient_tags')
            .update(updateData)
            .eq('id', req.params.id)
            .select();

        if (error) throw error;
        res.status(200).json(data[0]);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a patient tag
// @route   DELETE /api/patients/:id
const deletePatientTag = async (req, res) => {
    try {
        const { error } = await supabase
            .from('patient_tags')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.status(200).json({ message: 'Patient tag deleted' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    getPatientTags,
    createPatientTag,
    updatePatientTag,
    deletePatientTag
};
