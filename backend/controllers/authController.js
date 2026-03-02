const supabase = require('../config/supabase');

// @desc    Register a new user
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
    const { email, password, phone, full_name, role, profession, blood_group } = req.body;

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    phone,
                    full_name,
                    role,
                    profession,
                    blood_group
                }
            }
        });

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Login user / Send OTP
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
    const { phone } = req.body;

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

module.exports = {
    registerUser,
    loginUser,
    verifyOTP
};
