const supabase = require('../config/supabase');

// Priority mapping for proper sorting
const PRIORITY_MAP = { 'Urgent': 3, 'High': 3, 'Moderate': 2, 'Medium': 2, 'Stable': 1, 'Low': 1 };

// @desc    Get all orders for a site
// @route   GET /api/orders/:siteId
const getOrders = async (req, res) => {
    try {
        let query = supabase
            .from('orders')
            .select('*')
            .eq('site_id', req.params.siteId)
            .order('created_at', { ascending: false });

        // Filter by status if query param provided
        if (req.query.status) {
            query = query.eq('status', req.query.status);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Sort by priority weight (Urgent > Moderate > Stable)
        const sorted = data.sort((a, b) => {
            return (PRIORITY_MAP[b.priority] || 0) - (PRIORITY_MAP[a.priority] || 0);
        });

        res.status(200).json(sorted);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Create a new order (Doctor prescribes for a patient)
// @route   POST /api/orders
const createOrder = async (req, res) => {
    const { site_id, patient_id, medicine_name, equipment_name, quantity, priority, notes } = req.body;

    if (!site_id || !patient_id || (!medicine_name && !equipment_name)) {
        return res.status(400).json({
            message: 'site_id, patient_id, and at least one of medicine_name or equipment_name are required'
        });
    }

    try {
        const { data, error } = await supabase
            .from('orders')
            .insert([{
                site_id,
                patient_id,
                doctor_id: req.user.id,
                medicine_name: medicine_name || null,
                equipment_name: equipment_name || null,
                quantity,
                priority: priority || 'Medium',
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

// @desc    Update order status (Pharmacy fulfillment)
// @route   PUT /api/orders/:id
const updateOrder = async (req, res) => {
    const { status, pharmacy_notes } = req.body;

    const validStatuses = ['pending', 'available', 'partially_available', 'unavailable', 'ready_for_pickup', 'in_transit', 'delivered'];

    if (status && !validStatuses.includes(status)) {
        return res.status(400).json({
            message: `status must be one of: ${validStatuses.join(', ')}`
        });
    }

    try {
        const updateData = {};
        if (status) updateData.status = status;
        if (pharmacy_notes) updateData.pharmacy_notes = pharmacy_notes;

        // If pharmacy marks as ready_for_pickup, record the timestamp
        if (status === 'ready_for_pickup') {
            updateData.ready_at = new Date().toISOString();
        }

        // If delivered, record the delivery timestamp
        if (status === 'delivered') {
            updateData.delivered_at = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', req.params.id)
            .select();

        if (error) throw error;
        res.status(200).json(data[0]);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get orders ready for driver pickup at a site
// @route   GET /api/orders/:siteId/pickup
const getPickupOrders = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('site_id', req.params.siteId)
            .eq('status', 'ready_for_pickup')
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Sort by priority: urgent items are locked (mandatory) for driver
        const sorted = data.sort((a, b) => {
            return (PRIORITY_MAP[b.priority] || 0) - (PRIORITY_MAP[a.priority] || 0);
        });

        const result = sorted.map(order => ({
            ...order,
            mandatory: (PRIORITY_MAP[order.priority] || 0) >= 3 // Urgent orders are mandatory
        }));

        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    getOrders,
    createOrder,
    updateOrder,
    getPickupOrders
};
