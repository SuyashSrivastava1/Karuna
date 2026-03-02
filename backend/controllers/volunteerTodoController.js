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
        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Create a new todo
// @route   POST /api/volunteer-todos
const createTodo = async (req, res) => {
    const { site_id, task_description, patient_tag_id } = req.body;

    if (!site_id || !task_description) {
        return res.status(400).json({ message: 'site_id and task_description are required' });
    }

    try {
        const { data, error } = await supabase
            .from('volunteer_todos')
            .insert([{
                site_id,
                user_id: req.user.id,
                task_description,
                patient_tag_id: patient_tag_id || null,
                status: 'pending'
            }])
            .select();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update todo status
// @route   PUT /api/volunteer-todos/:id
const updateTodo = async (req, res) => {
    const { status, task_description } = req.body;

    const validStatuses = ['pending', 'in_progress', 'completed'];
    if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ message: `status must be one of: ${validStatuses.join(', ')}` });
    }

    try {
        const updateData = {};
        if (status) updateData.status = status;
        if (task_description) updateData.task_description = task_description;
        if (status === 'completed') updateData.completed_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('volunteer_todos')
            .update(updateData)
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
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
        const { error } = await supabase
            .from('volunteer_todos')
            .delete()
            .eq('id', req.params.id)
            .eq('user_id', req.user.id);

        if (error) throw error;
        res.status(200).json({ message: 'Todo deleted' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    getTodos,
    createTodo,
    updateTodo,
    deleteTodo
};
