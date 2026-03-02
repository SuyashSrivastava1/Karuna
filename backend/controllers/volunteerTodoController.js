const supabase = require('../config/supabase');

// @desc    Get todos for the logged-in volunteer at a site
// @route   GET /api/volunteer-todos/:siteId
const getTodos = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('volunteer_todos')
            .select('*')
            .eq('site_id', req.params.siteId)
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: true });

        if (error) throw error;
        res.status(200).json(data || []);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new todo
// @route   POST /api/volunteer-todos
const createTodo = async (req, res) => {
    const { site_id, task_description, patient_tag_id } = req.body;

    if (!site_id || !task_description || !task_description.trim()) {
        return res.status(400).json({ message: 'site_id and task_description are required' });
    }

    const trimmed = task_description.trim();
    if (trimmed.length > 500) {
        return res.status(400).json({ message: 'task_description cannot exceed 500 characters' });
    }

    try {
        // Verify site exists
        const { data: site } = await supabase.from('sites').select('id').eq('id', site_id).single();
        if (!site) {
            return res.status(404).json({ message: 'Site not found' });
        }

        // Verify patient tag exists if linked
        if (patient_tag_id) {
            const { data: tag } = await supabase.from('patient_tags').select('id').eq('id', patient_tag_id).single();
            if (!tag) {
                return res.status(404).json({ message: 'Patient tag not found' });
            }
        }

        const { data, error } = await supabase
            .from('volunteer_todos')
            .insert([{
                site_id,
                user_id: req.user.id,
                task_description: trimmed,
                patient_tag_id: patient_tag_id || null,
                status: 'pending'
            }])
            .select();

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update todo status
// @route   PUT /api/volunteer-todos/:id
const updateTodo = async (req, res) => {
    const { status, task_description } = req.body;

    if (!status && !task_description) {
        return res.status(400).json({ message: 'Provide status or task_description to update' });
    }

    const validStatuses = ['pending', 'in_progress', 'completed'];
    if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ message: `status must be one of: ${validStatuses.join(', ')}` });
    }

    if (task_description && task_description.trim().length > 500) {
        return res.status(400).json({ message: 'task_description cannot exceed 500 characters' });
    }

    try {
        // Verify todo exists and belongs to user
        const { data: existing } = await supabase
            .from('volunteer_todos')
            .select('id, user_id')
            .eq('id', req.params.id)
            .single();

        if (!existing) {
            return res.status(404).json({ message: 'Todo not found' });
        }
        if (existing.user_id !== req.user.id) {
            return res.status(403).json({ message: 'You can only update your own todos' });
        }

        const updateData = {};
        if (status) updateData.status = status;
        if (task_description) updateData.task_description = task_description.trim();
        if (status === 'completed') updateData.completed_at = new Date().toISOString();
        // Clear completed_at if un-completing
        if (status && status !== 'completed') updateData.completed_at = null;

        const { data, error } = await supabase
            .from('volunteer_todos')
            .update(updateData)
            .eq('id', req.params.id)
            .select();

        if (error) throw error;
        res.status(200).json(data[0]);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a todo
// @route   DELETE /api/volunteer-todos/:id
const deleteTodo = async (req, res) => {
    try {
        // Verify todo exists and belongs to user
        const { data: existing } = await supabase
            .from('volunteer_todos')
            .select('id, user_id')
            .eq('id', req.params.id)
            .single();

        if (!existing) {
            return res.status(404).json({ message: 'Todo not found' });
        }
        if (existing.user_id !== req.user.id) {
            return res.status(403).json({ message: 'You can only delete your own todos' });
        }

        const { error } = await supabase
            .from('volunteer_todos')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.status(200).json({ message: 'Todo deleted' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { getTodos, createTodo, updateTodo, deleteTodo };
