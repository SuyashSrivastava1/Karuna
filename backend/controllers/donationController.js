const supabase = require('../config/supabase');

// @desc    Create a donation
// @route   POST /api/donations
const createDonation = async (req, res) => {
    const { donor_name, email, type, amount, items, site_id } = req.body;

    try {
        const { data, error } = await supabase
            .from('donations')
            .insert([{ donor_name, email, type, amount, items, site_id }])
            .select();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all donations (Admin/Staff only ideally)
// @route   GET /api/donations
const getDonations = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('donations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    createDonation,
    getDonations
};
