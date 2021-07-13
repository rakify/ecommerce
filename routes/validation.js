const {
    string
} = require('joi');
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
        _id: Joi.string()
    });
    return schema.validate(data);
}

const categoryValidation = (data) => {
    const schema = Joi.object({
        title: Joi.string()
            .min(3).
        required(),
        slug: Joi.string(),
        _id: Joi.string()
    });
    return schema.validate(data);
}

const productValidation = (data) => {
    const schema = Joi.object({
        title: Joi.string()
            .min(3)
            .trim()
            .required(),
        slug: Joi.string()
            .allow(''),
        description: Joi.string()
            .min(3)
            .trim()
            .required(),
        category: Joi.string()
            .required(),
        price: Joi.number()
            .min(1)
            .required(),
        images: Joi.array()
            .max(5)
            .allow(''),
        _id: Joi.string()
    });
    return schema.validate(data);
}

const registerValidation = (data) => {
    const schema = Joi.object({
        username: Joi.string()
            .min(3).
        required(),
        email: Joi.string()
            .email()
            .allow(""),
        password: Joi.string()
            .min(3)
            .required(),
        password2: Joi.any().equal(Joi.ref('password'))
            .required()
            .options({
                messages: {
                    'any.only': 'Passwords do not match'
                }
            }),
        fname: Joi.string()
            .min(3)
            .allow(""),
        lname: Joi.string()
            .min(3)
            .allow(""),
        pn: Joi.string()
            .min(11)
            .allow(""),
    });
    return schema.validate(data);
}

const passwordValidation = (data) => {
    const schema = Joi.object({
        newPw: Joi.string()
            .min(3)
            .required(),
        confirmNewPw: Joi.any().equal(Joi.ref('newPw'))
            .options({
                messages: {
                    'any.only': 'Passwords do not match'
                }
            })
            .required(),
    });
    return schema.validate(data);
}

const updateValidation = (data) => {
    const schema = Joi.object({
        username: Joi.string()
            .min(3)
            .required(),
        email: Joi.string()
            .email()
            .allow(''),
        password: Joi.string()
            .min(3)
            .allow(''),
        password2: Joi.any().equal(Joi.ref('password'))
            .options({
                messages: {
                    'any.only': 'Passwords do not match'
                }
            })
            .allow(""),
        fname: Joi.string()
            .min(3)
            .allow(""),
        lname: Joi.string()
            .min(3)
            .allow(""),
        pn: Joi.string()
            .length(11)
            .pattern(/^\d+$/) //d for only digits
            .allow("")
            .messages({
                'string.length': 'Phone number must contain 11 digits',
                'string.pattern.base': 'Phone number must contain only digits'
            }),
        division: Joi.string()
            .allow(""),
        district: Joi.string()
            .allow(""),
        address: Joi.string()
            .allow(""),
    });
    return schema.validate(data);
}


module.exports.updateValidation = updateValidation;
module.exports.passwordValidation = passwordValidation;
module.exports.registerValidation = registerValidation;
module.exports.pageValidation = pageValidation;
module.exports.productValidation = productValidation;
module.exports.categoryValidation = categoryValidation;