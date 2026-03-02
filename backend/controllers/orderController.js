const supabase = require('../config/supabase');

const PRIORITY_MAP = { 'Urgent': 3, 'High': 3, 'Moderate': 2, 'Medium': 2, 'Stable': 1, 'Low': 1 };
const VALID_STATUSES = ['pending', 'available', 'partially_available', 'unavailable', 'ready_for_pickup', 'in_transit', 'delivered'];

// Valid status transitions — prevents skipping lifecycle steps
const VALID_TRANSITIONS = {
    'pending': ['available', 'partially_available', 'unavailable'],
    'available': ['ready_for_pickup'],
    'partially_available': ['ready_for_pickup', 'unavailable'],
    'unavailable': [],
    'ready_for_pickup': ['in_transit'],
    'in_transit': ['delivered'],
    'delivered': []
};

// @desc    Get all orders for a site
// @route   GET /api/orders/:siteId
const getOrders = async (req, res) => {
    try {
        let query = supabase
            .from('orders')
            .select('*')
            .eq('site_id', req.params.siteId)
            .order('created_at', { ascending: false });

        if (req.query.status) {
            if (!VALID_STATUSES.includes(req.query.status)) {
                return res.status(400).json({ message: `Invalid status filter. Must be one of: ${VALID_STATUSES.join(', ')}` });
            }
            query = query.eq('status', req.query.status);
        }

        const { data, error } = await query;
        if (error) throw error;

        const sorted = (data || []).sort((a, b) => {
            return (PRIORITY_MAP[b.priority] || 0) - (PRIORITY_MAP[a.priority] || 0);
        });

        res.status(200).json(sorted);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new order
// @route   POST /api/orders
const createOrder = async (req, res) => {
    const { site_id, patient_id, medicine_name, equipment_name, quantity, priority, notes } = req.body;

    if (!site_id || !patient_id || (!medicine_name && !equipment_name)) {
        return res.status(400).json({
            message: 'site_id, patient_id, and at least one of medicine_name or equipment_name are required'
        });
    }

    // Validate priority
    const validPriorities = ['Urgent', 'Medium', 'Low'];
    if (priority && !validPriorities.includes(priority)) {
        return res.status(400).json({ message: `priority must be one of: ${validPriorities.join(', ')}` });
    }

    // Verify site exists
    try {
        const { data: site } = await supabase.from('sites').select('id').eq('id', site_id).single();
        if (!site) {
            return res.status(404).json({ message: 'Site not found' });
        }

        const { data, error } = await supabase
            .from('orders')
            .insert([{
                site_id,
                patient_id,
                doctor_id: req.user.id,
                medicine_name: medicine_name ? medicine_name.trim() : null,
                equipment_name: equipment_name ? equipment_name.trim() : null,
                quantity: quantity || null,
                priority: priority || 'Medium',
                notes: notes ? notes.trim() : null,
                status: 'pending'
            }])
            .select();

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update order status (Pharmacy fulfillment)
// @route   PUT /api/orders/:id
const updateOrder = async (req, res) => {
    const { status, pharmacy_notes } = req.body;

    if (!status && !pharmacy_notes) {
        return res.status(400).json({ message: 'Provide status or pharmacy_notes to update' });
    }

    if (status && !VALID_STATUSES.includes(status)) {
        return res.status(400).json({ message: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    try {
        // Fetch existing order to validate transition
        const { data: existing, error: fetchErr } = await supabase
            .from('orders')
            .select('status')
            .eq('id', req.params.id)
            .single();

        if (fetchErr || !existing) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Enforce valid status transition
        if (status) {
            const allowed = VALID_TRANSITIONS[existing.status] || [];
            if (!allowed.includes(status)) {
                return res.status(400).json({
                    message: `Cannot transition from '${existing.status}' to '${status}'. Allowed: ${allowed.join(', ') || 'none (terminal state)'}`
                });
            }
        }

        const updateData = {};
        if (status) updateData.status = status;
        if (pharmacy_notes) updateData.pharmacy_notes = pharmacy_notes.trim();
        if (status === 'ready_for_pickup') updateData.ready_at = new Date().toISOString();
        if (status === 'delivered') updateData.delivered_at = new Date().toISOString();

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

// @desc    Get orders ready for driver pickup
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

        const sorted = (data || []).sort((a, b) => {
            return (PRIORITY_MAP[b.priority] || 0) - (PRIORITY_MAP[a.priority] || 0);
        });

        const result = sorted.map(order => ({
            ...order,
            mandatory: (PRIORITY_MAP[order.priority] || 0) >= 3
        }));

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getOrders, createOrder, updateOrder, getPickupOrders };
