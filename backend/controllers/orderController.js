const supabase = require('../config/supabase');

// @desc    Get all orders for a site
// @route   GET /api/orders/:siteId
const getOrders = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('site_id', req.params.siteId)
            .order('priority', { ascending: false });

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Create a new order
// @route   POST /api/orders
const createOrder = async (req, res) => {
    const { site_id, patient_id, medicine_name, quantity, priority, notes } = req.body;

    try {
        const { data, error } = await supabase
            .from('orders')
            .insert([{
                site_id,
                patient_id,
                doctor_id: req.user.id,
                medicine_name,
                quantity,
                priority,
                notes,
                status: 'pending'
            }])
            .select();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update order status
// @route   PUT /api/orders/:id
const updateOrder = async (req, res) => {
    const { status, pharmacy_notes } = req.body;

    try {
        const { data, error } = await supabase
            .from('orders')
            .update({ status, pharmacy_notes })
            .eq('id', req.params.id)
            .select();

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    getOrders,
    createOrder,
    updateOrder
};
