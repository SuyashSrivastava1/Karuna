const supabase = require('../config/supabase');

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

    try {
        const { data, error } = await supabase
            .from('sites')
            .insert([{ name, location, urgency_score, patient_count }])
            .select();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    getSites,
    getSiteById,
    createSite
};
