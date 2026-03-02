const supabase = require('../config/supabase');

// @desc    Register a new user
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
    const {
        email, password, phone, full_name, role,
        blood_group, date_of_birth, profession,
        medical_specialty, pharmacy_address,
        doctor_registration_number, pharmacy_registration_number,
        volunteer_availability
    } = req.body;

    // Email is now the primary required identifier
    if (!email || !full_name || !role) {
        return res.status(400).json({ message: 'email, full_name, and role are required fields' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ message: 'Invalid email format' });
    }

    // Sanitize phone: must be E.164 format-ish (if provided)
    if (phone) {
        const phoneRegex = /^\+?[1-9]\d{6,14}$/;
        if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
            return res.status(400).json({ message: 'Invalid phone number format. Use format: +91XXXXXXXXXX' });
        }
    }

    // Trim and validate full_name
    const trimmedName = full_name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
        return res.status(400).json({ message: 'full_name must be between 2 and 100 characters' });
    }

    const validRoles = ['doctor', 'pharmacy', 'volunteer'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ message: `role must be one of: ${validRoles.join(', ')}` });
    }

    // Role-specific validation
    if (role === 'doctor' && !medical_specialty) {
        return res.status(400).json({ message: 'medical_specialty is required for doctors' });
    }
    if (role === 'pharmacy' && !pharmacy_address) {
        return res.status(400).json({ message: 'pharmacy_address is required for pharmacies' });
    }

    try {
        const cleanEmail = email.trim().toLowerCase();
        const cleanPhone = phone ? phone.replace(/\s/g, '') : null;

        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: cleanEmail,
            password: password || cleanEmail,
            options: {
                data: { phone: cleanPhone, full_name: trimmedName, role },
                emailRedirectTo: undefined
            }
        });

        if (authError) throw authError;

        // Edge case: Supabase returns user but no ID (shouldn't happen but guard)
        if (!authData.user || !authData.user.id) {
            return res.status(500).json({ message: 'Registration failed: no user ID returned' });
        }

        const profileData = {
            id: authData.user.id,
            full_name: trimmedName,
            email: cleanEmail,
            phone: cleanPhone,
            role,
            profession: profession || null,
            date_of_birth: date_of_birth || null,
            blood_group: role !== 'pharmacy' ? (blood_group || null) : null,
            medical_specialty: role === 'doctor' ? (medical_specialty || null) : null,
            pharmacy_address: role === 'pharmacy' ? (pharmacy_address || null) : null,
            doctor_registration_number: role === 'doctor' ? (doctor_registration_number || null) : null,
            pharmacy_registration_number: role === 'pharmacy' ? (pharmacy_registration_number || null) : null,
            volunteer_availability: role === 'volunteer' ? (volunteer_availability || null) : null
        };

        const { error: profileError } = await supabase
            .from('users')
            .upsert([profileData]);

        if (profileError) {
            console.error('Profile insert error (non-fatal):', profileError.message);
        }

        res.status(201).json({
            message: 'Registration successful. Check your email to verify your account.',
            user: authData.user,
            session: authData.session
        });
    } catch (error) {
        // Handle duplicate registration
        if (error.message && error.message.includes('already registered')) {
            return res.status(409).json({ message: 'A user with this email already exists' });
        }
        res.status(400).json({ message: error.message });
    }
};

// @desc    Login user — sends OTP to email
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'email is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ message: 'Invalid email format' });
    }

    try {
        const { data, error } = await supabase.auth.signInWithOtp({
            email: email.trim().toLowerCase()
        });
        if (error) throw error;
        res.status(200).json({ message: 'OTP sent to your email address', data });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Verify email OTP
// @route   POST /api/auth/verify-otp
const verifyOTP = async (req, res) => {
    const { email, token } = req.body;

    if (!email || !token) {
        return res.status(400).json({ message: 'email and token are required' });
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(token)) {
        return res.status(400).json({ message: 'OTP must be exactly 6 digits' });
    }

    try {
        const { data, error } = await supabase.auth.verifyOtp({
            email: email.trim().toLowerCase(),
            token,
            type: 'email'
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

        if (error || !data) {
            return res.status(404).json({ message: 'User profile not found. Please complete registration.' });
        }
        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update current user's profile
// @route   PUT /api/auth/me
const updateMe = async (req, res) => {
    const allowedFields = [
        'full_name', 'phone', 'email', 'profession', 'blood_group', 'date_of_birth',
        'medical_specialty', 'pharmacy_address',
        'doctor_registration_number', 'pharmacy_registration_number', 'volunteer_availability',
        'vehicle_availability', 'medical_equipment', 'medical_fitness',
        'availability_duration', 'disaster_knowledge'
    ];

    const updates = {};
    allowedFields.forEach(field => {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    // Edge case: empty update body
    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'No valid fields provided to update' });
    }

    // Validate full_name if provided
    if (updates.full_name !== undefined) {
        const name = updates.full_name.trim();
        if (name.length < 2 || name.length > 100) {
            return res.status(400).json({ message: 'full_name must be between 2 and 100 characters' });
        }
        updates.full_name = name;
    }

    try {
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', req.user.id)
            .select();

        if (error) throw error;
        if (!data || data.length === 0) {
            return res.status(404).json({ message: 'User profile not found' });
        }
        res.status(200).json(data[0]);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { registerUser, loginUser, verifyOTP, getMe, updateMe };
