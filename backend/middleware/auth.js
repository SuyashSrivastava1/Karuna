const supabase = require('../config/supabase');

// @desc    Verify JWT token and attach user to request
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            // Edge case: token is empty string after split
            if (!token || token.trim() === '') {
                return res.status(401).json({ message: 'Not authorized, empty token' });
            }

            const { data: { user }, error } = await supabase.auth.getUser(token);

            if (error || !user) {
                return res.status(401).json({ message: 'Not authorized, token failed' });
            }

            // Fetch the user's profile from our users table for role info
            const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            req.user = user;
            req.profile = profile || null;
            return next();
        } catch (error) {
            console.error('Auth middleware error:', error.message);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    return res.status(401).json({ message: 'Not authorized, no token provided' });
};

// @desc    Role-based authorization middleware
// @usage   router.post('/route', protect, authorize('doctor', 'pharmacy'), handler)
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.profile) {
            return res.status(403).json({
                message: 'Access denied. User profile not found. Please complete registration.'
            });
        }
        if (!roles.includes(req.profile.role)) {
            return res.status(403).json({
                message: `Access denied. This action requires one of the following roles: ${roles.join(', ')}`
            });
        }
        return next();
    };
};

module.exports = { protect, authorize };
