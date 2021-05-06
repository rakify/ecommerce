const Joi = require('joi');


const pageValidation = (data) => {
    const schema = Joi.object({
        title: Joi.string()
            .required()
            .min(3),
        slug: Joi.string()
            .allow(''),
        content: Joi.string()
            .min(5)
            .required(),
        sorting: Joi.number(),
        id: Joi.string()
            .allow("")
    });
    return schema.validate(data);
}

const categoryValidation = (data) => {
    const schema = Joi.object({
        username: Joi.string()
            .min(3).
        required(),
        email: Joi.string()
            .email()
            .allow(""),
        password: Joi.string()
            .min(3)
            .required()
    });
    return schema.validate(data);
}

const loginValidation = (data) => {
    const schema = Joi.object({
        username: Joi.string()
            .min(3).
        required(),
        password: Joi.string()
            .min(3)
            .required()
    });
    return schema.validate(data);
}

module.exports.pageValidation = pageValidation;
module.exports.loginValidation = loginValidation;
module.exports.categoryValidation = categoryValidation;