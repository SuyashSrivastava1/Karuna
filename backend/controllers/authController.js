const supabase = require('../config/supabase');

// @desc    Register a new user
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
    const { email, password, phone, full_name, role, profession, blood_group,
        date_of_birth, medical_specialty, pharmacy_address,
        vehicle_availability, medical_equipment, medical_fitness,
        availability_duration, disaster_knowledge } = req.body;

    // Input validation
    if (!phone || !full_name || !role) {
        return res.status(400).json({ message: 'phone, full_name, and role are required fields' });
    }

    const validRoles = ['doctor', 'pharmacy', 'volunteer'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ message: `role must be one of: ${validRoles.join(', ')}` });
    }

    try {
        // 1. Create the auth user in Supabase
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email || `${phone.replace(/\+/g, '')}@karuna.app`,
            password: password || phone, // fallback for OTP-first flow
            options: {
                data: {
                    phone,
                    full_name,
                    role
                }
            }
        });

        if (authError) throw authError;

        // 2. Also insert a row into the users table with the full profile
        if (authData.user) {
            const profileData = {
                id: authData.user.id,
                full_name,
                phone,
                role,
                profession: profession || null,
                blood_group: blood_group || null,
                date_of_birth: date_of_birth || null,
                medical_specialty: role === 'doctor' ? (medical_specialty || null) : null,
                pharmacy_address: role === 'pharmacy' ? (pharmacy_address || null) : null,
                vehicle_availability: vehicle_availability || null,
                medical_equipment: medical_equipment || null,
                medical_fitness: medical_fitness !== undefined ? medical_fitness : null,
                availability_duration: availability_duration || null,
                disaster_knowledge: disaster_knowledge || null
            };

            const { error: profileError } = await supabase
                .from('users')
                .upsert([profileData]);

            if (profileError) {
                console.error('Profile insert error (non-fatal):', profileError.message);
            }
        }

        res.status(201).json({
            message: 'Registration successful',
            user: authData.user,
            session: authData.session
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Login user / Send OTP
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({ message: 'phone is required' });
    }

    try {
        const { data, error } = await supabase.auth.signInWithOtp({
            phone: phone,
        });

        if (error) throw error;

        res.status(200).json({ message: 'OTP sent to your phone', data });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
const verifyOTP = async (req, res) => {
    const { phone, token } = req.body;

    if (!phone || !token) {
        return res.status(400).json({ message: 'phone and token are required' });
    }

    try {
        const { data, error } = await supabase.auth.verifyOtp({
            phone,
            token,
            type: 'sms'
        });

        if (error) throw error;

        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get current user's profile
// @route   GET /api/auth/me
const getMe = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', req.user.id)
            .single();

        if (error) throw error;

        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update current user's profile
// @route   PUT /api/auth/me
const updateMe = async (req, res) => {
    const allowedFields = ['full_name', 'phone', 'profession', 'blood_group',
        'date_of_birth', 'medical_specialty', 'pharmacy_address',
        'vehicle_availability', 'medical_equipment', 'medical_fitness',
        'availability_duration', 'disaster_knowledge'];

    const updates = {};
    allowedFields.forEach(field => {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    try {
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', req.user.id)
            .select();

        if (error) throw error;

        res.status(200).json(data[0]);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    verifyOTP,
    getMe,
    updateMe
};
