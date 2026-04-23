const Joi = require('joi');

const validateSignup = (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        role: Joi.string().valid('community_member', 'facility_manager', 'worker', 'admin').required()
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

module.exports = { validateSignup, validateLogin }; //gg
