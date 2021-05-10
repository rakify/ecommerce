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
        image: Joi.string()
            .required(),
        _id: Joi.string()    
    });
    return schema.validate(data);
}

module.exports.pageValidation = pageValidation;
module.exports.productValidation = productValidation;
module.exports.categoryValidation = categoryValidation;