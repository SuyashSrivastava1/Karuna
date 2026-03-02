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
        res.status(200).json(data || []);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a patient tag (Nurse intake)
// @route   POST /api/patients
const createPatientTag = async (req, res) => {
    const { site_id, patient_id, triage_level, diagnosis, vitals, nurse_notes } = req.body;

    if (!site_id || !patient_id) {
        return res.status(400).json({ message: 'site_id and patient_id are required' });
    }

    // Validate patient_id format
    if (!/^TAG-\d{3,}$/.test(patient_id)) {
        return res.status(400).json({ message: 'patient_id must follow format: TAG-001, TAG-002, etc.' });
    }

    const validLevels = ['Urgent', 'Moderate', 'Stable'];
    if (triage_level && !validLevels.includes(triage_level)) {
        return res.status(400).json({ message: `triage_level must be one of: ${validLevels.join(', ')}` });
    }

    try {
        // Verify site exists
        const { data: site } = await supabase.from('sites').select('id').eq('id', site_id).single();
        if (!site) {
            return res.status(404).json({ message: 'Site not found' });
        }

        // Check for duplicate patient_id at this site
        const { data: existing } = await supabase
            .from('patient_tags')
            .select('id')
            .eq('site_id', site_id)
            .eq('patient_id', patient_id)
            .limit(1);

        if (existing && existing.length > 0) {
            return res.status(409).json({ message: `Patient ${patient_id} already exists at this site` });
        }

        const { data, error } = await supabase
            .from('patient_tags')
            .insert([{
                site_id,
                patient_id,
                triage_level: triage_level || 'Stable',
                diagnosis: diagnosis ? diagnosis.trim() : null,
                vitals: vitals ? vitals.trim() : null,
                nurse_notes: nurse_notes ? nurse_notes.trim() : null,
                created_by: req.user.id
            }])
            .select();

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update patient tag
// @route   PUT /api/patients/:id
const updatePatientTag = async (req, res) => {
    const { triage_level, diagnosis, vitals, nurse_notes } = req.body;

    const validLevels = ['Urgent', 'Moderate', 'Stable'];
    if (triage_level && !validLevels.includes(triage_level)) {
        return res.status(400).json({ message: `triage_level must be one of: ${validLevels.join(', ')}` });
    }

    const updateData = {};
    if (triage_level) updateData.triage_level = triage_level;
    if (diagnosis !== undefined) updateData.diagnosis = diagnosis ? diagnosis.trim() : null;
    if (vitals !== undefined) updateData.vitals = vitals ? vitals.trim() : null;
    if (nurse_notes !== undefined) updateData.nurse_notes = nurse_notes ? nurse_notes.trim() : null;

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: 'No valid fields provided to update' });
    }

    try {
        // Verify tag exists
        const { data: existing } = await supabase.from('patient_tags').select('id').eq('id', req.params.id).single();
        if (!existing) {
            return res.status(404).json({ message: 'Patient tag not found' });
        }

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
        // Verify tag exists
        const { data: existing } = await supabase.from('patient_tags').select('id').eq('id', req.params.id).single();
        if (!existing) {
            return res.status(404).json({ message: 'Patient tag not found' });
        }

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

// @desc    Auto-generate next patient ID for a site
// @route   GET /api/patients/:siteId/next-id
const getNextPatientId = async (req, res) => {
    try {
        // Get the highest existing TAG number, not just count (handles gaps from deletions)
        const { data: tags, error } = await supabase
            .from('patient_tags')
            .select('patient_id')
            .eq('site_id', req.params.siteId)
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) throw error;

        let nextNumber = 1;
        if (tags && tags.length > 0) {
            const match = tags[0].patient_id.match(/TAG-(\d+)/);
            if (match) nextNumber = parseInt(match[1], 10) + 1;
        }

        const nextId = `TAG-${String(nextNumber).padStart(3, '0')}`;
        res.status(200).json({ next_patient_id: nextId });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { getPatientTags, createPatientTag, updatePatientTag, deletePatientTag, getNextPatientId };
