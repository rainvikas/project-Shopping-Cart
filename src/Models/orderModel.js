const mongoose = require('mongoose')
ObjectId = mongoose.Schema.Types.ObjectId

const orderSchema = new mongoose.Schema({
    userId: {type:ObjectId, ref: "user", required:true},
  items: [{
    productId: {type: ObjectId, refs: "user", required: true, trim : true},
    quantity: {type: Number, required: true, min: 1}
  }],
  totalPrice: {type: Number, required: true, trim: true},
  totalItems: {type: Number, required: true,trim: true},
  totalQuantity: {type: Number, required: true, trim: true},
  cancellable: {type: Boolean, default: true},
  status: {type: String, default: 'pending', enum:["pending", "completed", "cancelled"]},
  deletedAt: {type: Date, default: null}, 
  isDeleted: {type: Boolean, default: false},
   
}, {timestamps: true})

module.exports = mongoose.model('order', orderSchema)