// import supabase from '../supabase.js';
// import asyncHandler from 'express-async-handler';

// // @desc    Register new user
// // @route   POST /api/auth/signup
// // @access  Public
// const signup = asyncHandler(async (req, res) => {
//     const { email, password, role } = req.body;

//     const { data, error } = await supabase.auth.signUp({
//         email,
//         password,
//         options: {
//             data: { role: role }
//         }
//     });

//     if (error) {
//         console.error('Supabase Signup Error:', error.message);
//         res.status(400);
//         throw new Error(error.message);
//     }

//     res.status(201).json({
//         message: 'User registered successfully',
//         user: {
//             id: data.user.id,
//             email: data.user.email,
//             role: data.user.user_metadata.role
//         }
//     });
// });

// // @desc    Authenticate a user
// // @route   POST /api/auth/login
// // @access  Public
// const login = asyncHandler(async (req, res) => {
//     const { email, password } = req.body;

//     const { data, error } = await supabase.auth.signInWithPassword({ email, password });

//     if (error) {
//         console.error('Supabase Login Error:', error.message);
//         res.status(401);
//         throw new Error(error.message);
//     }

//     res.status(200).json({
//         token: data.session.access_token,
//         user: {
//             id: data.user.id,
//             email: data.user.email,
//             role: data.user.user_metadata.role
//         }
//     });
// });

// export { signup, login };
import supabase from '../supabase.js';
import asyncHandler from 'express-async-handler';

// ─── SIGNUP ───────────────────────────────────────────────────────────────────

const signup = asyncHandler(async (req, res) => {
    const { email, password, role, cm_role, major, department, full_name } = req.body;

    // required field check
    const requiredFields = { full_name, email, password, role };
    if (role === 'community_member') {
        requiredFields.cm_role = cm_role;
        if (cm_role === 'student') requiredFields.major = major;
        if (cm_role === 'staff') requiredFields.department = department;
    }

    const missing = Object.entries(requiredFields)
        .filter(([, v]) => !v || v === 'placeholder')
        .map(([k]) => k);

    if (missing.length > 0) {
        res.status(400);
        throw new Error(`Please fill out all fields: ${missing.join(', ')}`);
    }

    // domain validation
    const domainMap = {
        CM_STUDENT: '@student.giu-uni.de',
        CM_STAFF: '@giu-uni.de',
        WORKER: '@worker.giu-uni.de',
        FM: '@manager.giu-uni.de',
    };

    const expectedDomain =
        role === 'community_member' && cm_role === 'student' ? domainMap.CM_STUDENT :
            role === 'community_member' && cm_role === 'staff' ? domainMap.CM_STAFF :
                role === 'worker' ? domainMap.WORKER :
                    role === 'facility_manager' ? domainMap.FM : null;

    if (!expectedDomain) {
        res.status(400);
        throw new Error('Invalid role.');
    }

    if (!email.endsWith(expectedDomain)) {
        res.status(400);
        throw new Error(`Email must end with ${expectedDomain}`);
    }

    // check if email already registered
    const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

    if (existing) {
        res.status(409);
        throw new Error('An account with this email already exists.');
    }

    // create Supabase Auth user — Supabase sends verification email automatically
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role } },
    });

    if (authError) {
        res.status(400);
        throw new Error(authError.message);
    }

    // insert into your users table
    const { error: dbError } = await supabase
        .from('users')
        .insert({
            id: authData.user.id,
            full_name,
            email,
            role,
            cm_role: role === 'community_member' ? cm_role : null,
            major: role === 'community_member' && cm_role === 'student' ? major : null,
            department: role === 'community_member' && cm_role === 'staff' ? department : null,
            is_active: true,
        });

    if (dbError) {
        res.status(500);
        throw new Error(dbError.message);
    }

    res.status(201).json({
        message: 'Account created. Please check your email to verify your account before logging in.',
        user: {
            id: authData.user.id,
            full_name,
            email: authData.user.email,
            role,
        },
    });
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400);
        throw new Error('Please fill out all fields.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        res.status(401);
        throw new Error('Incorrect email or password.');
    }

    // TODO: re-enable email verification check before production
    // const { data: authUser, error: authUserError } = await supabase.auth.admin.getUserById(data.user.id);
    // if (authUserError) { res.status(500); throw new Error('Could not verify account status.'); }
    // if (!authUser.user.email_confirmed_at) { res.status(403); throw new Error('Please verify your email before logging in.'); }

    // fetch from your users table
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, full_name, email, role, cm_role, major, department, theme, is_active')
        .eq('id', data.user.id)
        .single();

    // if (userError || !userData) {
    //     res.status(500);
    //     throw new Error('Could not retrieve user data.');
    // }

    //temp:

    if (userError || !userData) {
        res.status(500);
        throw new Error(userError?.message || 'Could not retrieve user data.');
    }

    if (!userData.is_active) {
        res.status(403);
        throw new Error('Your account has been deactivated.');
    }

    res.status(200).json({
        token: data.session.access_token,
        user: userData,
    });
});

export { signup, login };