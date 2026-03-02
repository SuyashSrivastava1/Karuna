const supabase = require('../config/supabase');

// @desc    Verify JWT token and attach user to request
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const { data: { user }, error } = await supabase.auth.getUser(token);

            if (error || !user) {
                return res.status(401).json({ message: 'Not authorized, token failed' });
            }

            // Fetch the user's profile from our users table for role info
            const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            req.user = user;
            req.profile = profile || null; // profile may not exist yet during registration
            next();
        } catch (error) {
            console.error('Auth middleware error:', error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        return res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};

// @desc    Role-based authorization middleware
// @usage   router.post('/route', protect, authorize('doctor', 'pharmacy'), handler)
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.profile || !roles.includes(req.profile.role)) {
            return res.status(403).json({
                message: `Access denied. This action requires one of the following roles: ${roles.join(', ')}`
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
