const mongoose = require('mongoose')
ObjectId = mongoose.Schema.Types.ObjectId

const cartSchema = new mongoose.Schema({
    userId : {type: ObjectId, ref: "user", required: true, unique: true, trim : true},

    items: [{
        productId: {type: ObjectId, ref: "product", required: true, trim: true},
        quantity: { type: Number, required: true, min : 1, trim: true},
        _id: false
    }],
    totalPrice: {type: Number, required: true, trim: true},
    totalItems: {type: Number, required: true},
}, {timestamps: true})

module.exports = mongoose.model('cart', cartSchema)