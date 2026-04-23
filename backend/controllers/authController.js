const supabase = require('../supabase');
const asyncHandler = require('express-async-handler');

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Publicc
exports.signup = asyncHandler(async (req, res) => {
    const { email, password, role } = req.body;

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { role: role }
        }
    });

    if (error) {
        console.error('Supabase Signup Error:', error.message);
        res.status(400);
        throw new Error(error.message);
    }

    res.status(201).json({
        message: 'User registered successfully',
        user: {
            id: data.user.id,
            email: data.user.email,
            role: data.user.user_metadata.role
        }
    });
});

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        console.error('Supabase Login Error:', error.message);
        res.status(401);
        throw new Error(error.message);
    }

    res.status(200).json({
        token: data.session.access_token,
        user: {
            id: data.user.id,
            email: data.user.email,
            role: data.user.user_metadata.role
        }
    });
});
