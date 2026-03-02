const supabase = require('../config/supabase');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

// @desc    Create a donation
// @route   POST /api/donations
const createDonation = async (req, res) => {
    const { donor_name, phone, email, type, amount, items, site_id,
        self_delivery, delivery_address } = req.body;

    if (!type) {
        return res.status(400).json({ message: 'Donation type is required (monetary or inkind)' });
    }

    const validTypes = ['monetary', 'inkind'];
    if (!validTypes.includes(type)) {
        return res.status(400).json({ message: `type must be one of: ${validTypes.join(', ')}` });
    }

    if (type === 'monetary') {
        if (!amount) return res.status(400).json({ message: 'Amount is required for monetary donations' });
        if (typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({ message: 'Amount must be a positive number' });
        }
        if (amount > 10000000) {
            return res.status(400).json({ message: 'Amount exceeds maximum limit' });
        }
    }

    if (type === 'inkind') {
        if (!items) return res.status(400).json({ message: 'Items description is required for in-kind donations' });
    }

    // If pickup requested, address is required
    if (type === 'inkind' && self_delivery === false && !delivery_address) {
        return res.status(400).json({ message: 'delivery_address is required when not self-delivering' });
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
    }

    try {
        // AI categorization for in-kind
        let category = null;
        if (type === 'inkind' && items && genAI) {
            try {
                const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
                const itemsStr = typeof items === 'string' ? items.substring(0, 200) : JSON.stringify(items).substring(0, 200);
                const prompt = `Categorize this donated item into ONE of: FOOD, CLOTHING, MEDICINE, EQUIPMENT, SHELTER, HYGIENE, OTHER.\nItem: "${itemsStr}"\nReturn ONLY the category name.`;

                const result = await model.generateContent(prompt);
                category = result.response.text().trim().toUpperCase().replace(/[^A-Z]/g, '');

                const validCategories = ['FOOD', 'CLOTHING', 'MEDICINE', 'EQUIPMENT', 'SHELTER', 'HYGIENE', 'OTHER'];
                if (!validCategories.includes(category)) category = 'OTHER';
            } catch (e) {
                category = 'OTHER';
            }
        } else if (type === 'inkind') {
            category = 'OTHER';
        }

        const donationData = {
            donor_name: donor_name ? donor_name.trim().substring(0, 100) : 'Anonymous',
            phone: phone || null,
            email: email || null,
            type,
            amount: type === 'monetary' ? amount : null,
            items: type === 'inkind' ? items : null,
            category,
            site_id: site_id || null,
            self_delivery: self_delivery || false,
            delivery_address: delivery_address ? delivery_address.trim() : null,
            delivery_status: type === 'inkind' ? (self_delivery ? 'self_delivering' : 'awaiting_pickup') : null
        };

        const { data, error } = await supabase
            .from('donations')
            .insert([donationData])
            .select();

        if (error) throw error;

        let deliveryMessage = '';
        if (type === 'inkind') {
            deliveryMessage = self_delivery
                ? 'Thank you! Please deliver the items to the nearest relief site. Check /api/sites for active locations.'
                : 'Thank you! A volunteer driver will be dispatched to pick up your donation.';
        } else {
            deliveryMessage = 'Thank you for your monetary donation!';
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

        if (req.query.type) {
            if (!['monetary', 'inkind'].includes(req.query.type)) {
                return res.status(400).json({ message: 'type filter must be "monetary" or "inkind"' });
            }
            query = query.eq('type', req.query.type);
        }
        if (req.query.delivery_status) {
            query = query.eq('delivery_status', req.query.delivery_status);
        }

        const { data, error } = await query;
        if (error) throw error;
        res.status(200).json(data || []);
    } catch (error) {
        res.status(500).json({ message: error.message });
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

        if (error || !data) {
            return res.status(404).json({ message: 'Donation not found' });
        }
        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update donation delivery status
// @route   PUT /api/donations/:id
const updateDonation = async (req, res) => {
    const { delivery_status } = req.body;

    if (!delivery_status) {
        return res.status(400).json({ message: 'delivery_status is required' });
    }

    const validStatuses = ['awaiting_pickup', 'self_delivering', 'driver_assigned', 'in_transit', 'delivered'];
    if (!validStatuses.includes(delivery_status)) {
        return res.status(400).json({ message: `delivery_status must be one of: ${validStatuses.join(', ')}` });
    }

    try {
        // Verify donation exists
        const { data: existing } = await supabase.from('donations').select('id, delivery_status').eq('id', req.params.id).single();
        if (!existing) {
            return res.status(404).json({ message: 'Donation not found' });
        }

        const updateData = { delivery_status };
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

module.exports = { createDonation, getDonations, getDonationById, updateDonation };
