const cartModel = require("../model/cartModel")
const mongoose = require('mongoose')
const userModel = require("../model/userModel")
const productModel = require("../model/productModel")
const ObjectId = mongoose.Types.ObjectId

const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    if (typeof value === 'number' && value.toString().trim().length === 0) return false
    return true;
}

const isValidObjectId = function (objectId) {
    return mongoose.Types.ObjectId.isValid(objectId)
}

const createCart = async function (req, res) {
    try {
        let data = req.body
        let userIdParams = req.params.userId
        let productId = req.body.items[0].productId


        let { userId, items, totalPrice, totalItems } = data
        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, msg: "req body can't be empty,BAD REQUEST" })
        }
        if (!isValid(userId)) {
            return res.status(400).send({ status: false, msg: "userId is required" })
        }
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, msg: "userId is not a valid objectId" })
        }
        if (!isValidObjectId(userIdParams)) {
            return res.status(400).send({ status: false, msg: "userIdParams is not a valid objectId" })
        }
        if (!isValid(productId)) {
            return res.status(400).send({ status: false, msg: "productId is required" })
        }
        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, msg: "productId is not a valid objectId" })
        }
        // if (Array.isArray(items)) {
        //     return res.status(400).send({ status: false, msg: "items is required and should be in array" })
        // }
        if (!(items[0].quantity)) {
            return res.status(400).send({ status: false, msg: "quantity is required" })
        }
        if (typeof (items[0].quantity) != typeof (1)) {
            return res.status(400).send({ status: false, msg: "quantity should be in number" })
        }

        let userDetails = await userModel.findOne({ _id: userId })
        if (!userDetails) {
            return res.status(400).send({ status: false, msg: "user not exist" })
        }

        let cartDetails = await cartModel.findOne({ userId: userId })
        if (!cartDetails) {
            let productDetails = await productModel.findOne({ _id: productId, isDeleted: false })
            if (!productDetails) {
                return res.status(400).send({ status: false, msg: "product not exist or deleted" })
            }
            let totalPriceProduct = productDetails.price * items[0].quantity
            let totalItemsOfProduct = items.length
            let cartToBeCreated = { userId, items, totalItems: totalItemsOfProduct, totalPrice: totalPriceProduct }

            let createdCart = await cartModel.create(cartToBeCreated)
            return res.status(201).send({ status: true, msg: "cart created successfully", data: createdCart })
        }
        else {
            let productDetails = await productModel.findOne({ _id: productId, isDeleted: false })
            if (!productDetails) {
                return res.status(404).send({ status: false, msg: "product not exist or deleted" })
            }

            let amount = cartDetails.totalPrice + (productDetails.price * items[0].quantity)

            for (let i = 0; i < cartDetails.items.length; i++) {
                if (cartDetails.items[i].productId == items[0].productId) {
                    cartDetails.items[i].quantity = cartDetails.items[i].quantity + items[0].quantity
                    let updateCart = await cartModel.findOneAndUpdate({ userId: userId }, { items: cartDetails.items, totalPrice: amount }, { new: true })
                    return res.status(200).send({ status: true, msg: "product added to cart successfully", data: updateCart })
                }
            }
            let totalItemsOfProduct = items.length + cartDetails.totalItems
            let cart = await cartModel.findOneAndUpdate({ userId: userId }, { $addToSet: { items: { $each: items } }, totalPrice: amount, totalItems: totalItemsOfProduct }, { new: true })
            return res.status(201).send({ status: true, msg: "product added to cart successfully", data: cart })
        }

    }
    catch (error) {
        console.log(error)
        res.status(500).send({ msg: error.message })
    }
}

module.exports = { createCart }