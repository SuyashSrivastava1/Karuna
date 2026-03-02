const supabase = require('../config/supabase');

// @desc    Get patient tags for a site
// @route   GET /api/patients/:siteId
const getPatientTags = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('patient_tags')
            .select('*')
            .eq('site_id', req.params.siteId);

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

    try {
        const { data, error } = await supabase
            .from('patient_tags')
            .insert([{ site_id, patient_id, triage_level, notes }])
            .select();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    getPatientTags,
    createPatientTag
};
