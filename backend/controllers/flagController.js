const supabase = require('../config/supabase');

// @desc    Submit a flag (complaint) or suggestion
// @route   POST /api/flags
const createFlag = async (req, res) => {
    const { site_id, type, issue_type, title, description, severity } = req.body;

    if (!site_id || !type || !description) {
        return res.status(400).json({ message: 'site_id, type, and description are required' });
    }

    const validTypes = ['suggestion', 'complaint'];
    if (!validTypes.includes(type)) {
        return res.status(400).json({ message: `type must be one of: ${validTypes.join(', ')}` });
    }

    const validSeverities = ['Low', 'Medium', 'Critical'];
    if (severity && !validSeverities.includes(severity)) {
        return res.status(400).json({ message: `severity must be one of: ${validSeverities.join(', ')}` });
    }

    const validIssueTypes = ['Workspace', 'Fellow Volunteer', 'Lead', 'Resources', 'Task', 'Other'];
    if (issue_type && !validIssueTypes.includes(issue_type)) {
        return res.status(400).json({ message: `issue_type must be one of: ${validIssueTypes.join(', ')}` });
    }

    try {
        const { data, error } = await supabase
            .from('flags')
            .insert([{
                site_id,
                submitted_by: req.user.id,
                type,              // 'suggestion' or 'complaint'
                issue_type: issue_type || null,
                title: title || null,
                description,
                severity: severity || 'Medium',
                status: 'open'
            }])
            .select();

        if (error) throw error;
        res.status(201).json({ message: `${type} submitted successfully`, flag: data[0] });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all flags for a site
// @route   GET /api/flags/:siteId
const getFlagsBySite = async (req, res) => {
    try {
        let query = supabase
            .from('flags')
            .select('*')
            .eq('site_id', req.params.siteId)
            .order('created_at', { ascending: false });

        if (req.query.type) query = query.eq('type', req.query.type);
        if (req.query.status) query = query.eq('status', req.query.status);

        const { data, error } = await query;
        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update flag status (e.g. resolve it)
// @route   PUT /api/flags/:id
const updateFlag = async (req, res) => {
    const { status, resolution_note } = req.body;
    const validStatuses = ['open', 'acknowledged', 'resolved', 'dismissed'];

    if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ message: `status must be one of: ${validStatuses.join(', ')}` });
    }

    try {
        const { data, error } = await supabase
            .from('flags')
            .update({ status, resolution_note: resolution_note || null })
            .eq('id', req.params.id)
            .select();

        if (error) throw error;
        res.status(200).json(data[0]);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { createFlag, getFlagsBySite, updateFlag };
