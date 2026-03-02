const supabase = require('../config/supabase');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @desc    Create a donation
// @route   POST /api/donations
const createDonation = async (req, res) => {
    const { donor_name, phone, email, type, amount, items, site_id,
        self_delivery, delivery_address } = req.body;

    if (!type) {
        return res.status(400).json({ message: 'Donation type is required (monetary or inkind)' });
    }

    if (type === 'monetary' && !amount) {
        return res.status(400).json({ message: 'Amount is required for monetary donations' });
    }

    if (type === 'inkind' && !items) {
        return res.status(400).json({ message: 'Items description is required for in-kind donations' });
    }

    try {
        // Auto-categorize in-kind donations using AI
        let category = null;
        if (type === 'inkind' && items) {
            try {
                const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
                const prompt = `Categorize this donated item into ONE of these categories: FOOD, CLOTHING, MEDICINE, EQUIPMENT, SHELTER, HYGIENE, OTHER.
        Item: "${typeof items === 'string' ? items : JSON.stringify(items)}"
        Return ONLY the category name as a single word.`;

                const result = await model.generateContent(prompt);
                category = result.response.text().trim().toUpperCase();

                const validCategories = ['FOOD', 'CLOTHING', 'MEDICINE', 'EQUIPMENT', 'SHELTER', 'HYGIENE', 'OTHER'];
                if (!validCategories.includes(category)) category = 'OTHER';
            } catch (e) {
                category = 'OTHER';
            }
        }

        const donationData = {
            donor_name: donor_name || 'Anonymous',
            phone: phone || null,
            email: email || null,
            type,
            amount: type === 'monetary' ? amount : null,
            items: type === 'inkind' ? items : null,
            category,
            site_id: site_id || null,
            self_delivery: self_delivery || false,
            delivery_address: delivery_address || null,
            delivery_status: self_delivery ? 'self_delivering' : 'awaiting_pickup'
        };

        const { data, error } = await supabase
            .from('donations')
            .insert([donationData])
            .select();

        if (error) throw error;

        // Build response message based on delivery preference
        let deliveryMessage = '';
        if (type === 'inkind') {
            if (self_delivery) {
                deliveryMessage = 'Thank you! Please deliver the items to the nearest relief site. Check /api/sites for active locations.';
            } else {
                deliveryMessage = 'Thank you! A volunteer driver will be dispatched to pick up your donation.';
            }
        }

        res.status(201).json({
            message: 'Donation recorded successfully',
            delivery_info: deliveryMessage,
            donation: data[0]
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all donations
// @route   GET /api/donations
const getDonations = async (req, res) => {
    try {
        let query = supabase
            .from('donations')
            .select('*')
            .order('created_at', { ascending: false });

        // Filter by type
        if (req.query.type) {
            query = query.eq('type', req.query.type);
        }

        // Filter by delivery status
        if (req.query.delivery_status) {
            query = query.eq('delivery_status', req.query.delivery_status);
        }

        const { data, error } = await query;
        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get a single donation
// @route   GET /api/donations/:id
const getDonationById = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('donations')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update donation delivery status
// @route   PUT /api/donations/:id
const updateDonation = async (req, res) => {
    const { delivery_status } = req.body;

    const validStatuses = ['awaiting_pickup', 'self_delivering', 'driver_assigned', 'in_transit', 'delivered'];
    if (delivery_status && !validStatuses.includes(delivery_status)) {
        return res.status(400).json({
            message: `delivery_status must be one of: ${validStatuses.join(', ')}`
        });
    }

    try {
        const updateData = {};
        if (delivery_status) updateData.delivery_status = delivery_status;
        if (delivery_status === 'delivered') updateData.delivered_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('donations')
            .update(updateData)
            .eq('id', req.params.id)
            .select();

        if (error) throw error;
        res.status(200).json(data[0]);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    createDonation,
    getDonations,
    getDonationById,
    updateDonation
};
