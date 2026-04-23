import Joi from 'joi';

const validateSignup = (req, res, next) => {
    const schema = Joi.object({
        full_name: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        role: Joi.string().valid('community_member', 'facility_manager', 'worker', 'admin').required(),
        cm_role: Joi.string().valid('student', 'staff').optional(),
        major: Joi.string().optional(),
        department: Joi.string().optional(),
    });

    console.log('Signup validation body:', req.body);
    const { error } = schema.validate(req.body);
    if (error) {
        console.log('Signup validation error:', error.details[0].message);
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
};

const validateLogin = (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    });

    console.log('Login validation body:', req.body);
    const { error } = schema.validate(req.body);
    if (error) {
        console.log('Login validation error:', error.details[0].message);
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
};

export { validateSignup, validateLogin };
