const ProductModel = require("../model/productModel")
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId
const aws = require('aws-sdk')

const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    if (typeof value === 'number' && value.toString().trim().length === 0) return false
    return true;
}

const isValidObjectId = function (objectId) {
    return mongoose.Types.ObjectId.isValid(objectId)
}

aws.config.update(
    {
        accessKeyId: "AKIAY3L35MCRVFM24Q7U",
        secretAccessKey: "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",
        region: "ap-south-1"
    }
)

let uploadFile = async (file) => {
    return new Promise(async function (resolve, reject) {
        let s3 = new aws.S3({ apiVersion: "2006-03-01" })
        var uploadParams = {
            ACL: "public-read",
            Bucket: "classroom-training-bucket",
            Key: "group-19/" + file.originalname,
            Body: file.buffer
        }

        s3.upload(uploadParams, function (err, data) {
            if (err) {
                return reject({ "error": err })
            }
            return resolve(data.Location)
        })
    })
}

const createProduct = async function (req, res) {
    try {
        let data = req.body.data
        let Data = JSON.parse(data)
        let files = req.files

        let { title, description, price, currencyId, currencyFormat, isFreeShipping, productImage, style, availableSizes, installments, deletedAt, isDeleted } = Data

        if (Object.keys(Data).length == 0) {
            return res.status(400).send({ status: false, msg: " req body can't be empty, BAD REQUEST" })
        }
        if (!isValid(title)) {
            return res.status(400).send({ status: false, msg: "title is required" })
        }
        if (!isValid(description)) {
            return res.status(400).send({ status: false, msg: "description is required" })
        }
        if (!price) {
            return res.status(400).send({ status: false, msg: "price is required" })
        }
        if (typeof (price) != typeof (1)) {
            return res.status(400).send({ status: false, msg: "price should be in number" })
        }
        if (price < 0) {
            return res.status(400).send({ status: false, msg: "price should be in positive integers" })
        }
        if (!isValid(currencyId)) {
            return res.status(400).send({ status: false, msg: "currencyId is required" })
        }
        if (currencyId != 'INR') {
            return res.status(400).send({ status: false, msg: "currencyId should be INR" })
        }
        if (!isValid(currencyFormat)) {
            return res.status(400).send({ status: false, msg: "currencyFormat is required" })
        }
        if (currencyFormat != '₹') {
            return res.status(400).send({ status: false, msg: "currencyFormat should be in ₹" })
        }
        if (!files || (files && files.length === 0)) {
            return res.status(400).send({ status: false, msg: "profileImage is required" })
        }

        if (Data.hasOwnProperty(style)) {
            if (!isValid(style)) {
                return res.status(400).send({ status: false, msg: "style data should be a valid data" })
            }
        }
        if (!Array.isArray(availableSizes)) {
            return res.status(400).send({ status: false, msg: "availableSizes is required" })
        }
        if (availableSizes) {
            for (let i = 0; i < availableSizes.length; i++) {
                if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(availableSizes[i]))) {
                    return res.status(400).send({ status: false, msg: `Available sizes must be among ${["S", "XS", "M", "X", "L", "XXL", "XL"]}` })
                }
            }
        }
        if (data.hasOwnProperty(installments)) {
            if (typeof (installments) != typeof (1)) {
                return res.status(400).send({ status: false, msg: "installments should be in number" })
            }
        }

        let isTitleAlreadyUsed = await ProductModel.findOne({ title })
        if (isTitleAlreadyUsed) {
            return res.status(400).send({ status: false, msg: "this title is already used please provide another title" })
        }

        if (isDeleted == true) {
            let profilePic = await uploadFile(files[0])
            let productToBeCreated = { title, description, price, currencyId, currencyFormat, isFreeShipping, productImage: profilePic, style, availableSizes, installments, deletedAt: Date.now(), isDeleted }
            let productCreated = await ProductModel.create(productToBeCreated)
            return res.status(201).send({ status: true, msg: "product created successfully", data: productCreated })
        }
        else {
            let profilePic = await uploadFile(files[0])
            let productToBeCreated = { title, description, price, currencyId, currencyFormat, isFreeShipping, productImage: profilePic, style, availableSizes, installments, isDeleted }
            let productCreated = await ProductModel.create(productToBeCreated)
            return res.status(201).send({ status: true, msg: "product created successfully", data: productCreated })
        }
    }
    catch (error) {
        console.log(error)
        res.status(500).send({ msg: error.message })
    }
}


const getFilterProduct = async function (req, res) {
    try {
        let data = req.query
        let { size, productName, priceGreaterThan, priceLessThan, priceSort } = data
        let filteredProduct = { isDeleted: false }

        if (size) {
            for (let i = 0; i < size.length; i++) {
                if ((["S", "XS", "M", "X", "L", "XXL", "XL"].includes(size[i]))) {
                    filteredProduct['availableSizes'] = size
                }
            }
        }
        if (isValid(productName)) {
            filteredProduct['title'] = { $regex: productName }
        }
        // if (typeof (price) == typeof (1)) {
        //     filteredProduct['price'] = price
        // }
        if (priceGreaterThan) {
            filteredProduct['price'] = { $gt: priceGreaterThan }
        }
        if (priceLessThan) {
            filteredProduct['price'] = { $lt: priceLessThan }
        }
        if (priceGreaterThan && priceLessThan) {
            filteredProduct['price'] = { $gt: priceGreaterThan, $lt: priceLessThan }
        }
        if (priceSort) {
            if (!(priceSort == 1 || priceSort == -1)) {
                return res.status(400).send({ status: false, msg: "you can sort price by value 1 or -1" })
            }
        }

        let productDetails = await ProductModel.find(filteredProduct).sort({ price: priceSort })
        if (productDetails.length == 0) {
            return res.status(404).send({ status: false, msg: "product not exist" })
        }
        else {
            return res.status(200).send({ status: true, msg: "product details fetched successfully", noOfProducts: productDetails.length, data: productDetails })
        }
    }
    catch (error) {
        console.log(error)
        res.status(500).send({ msg: error.message })
    }
}

const getProductDetails = async function (req, res) {
    try {
        let productId = req.params.productId

        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, msg: "productId is not a valid objectId" })
        }
        let productDetails = await ProductModel.findOne({ _id: productId, isDeleted: false })
        if (!productDetails) {
            return res.status(404).send({ status: false, msg: "product not exist with this productId" })
        }
        else {
            return res.status(200).send({ status: true, msg: "details fetched successfully", data: productDetails })
        }

    }
    catch (error) {
        console.log(error)
        res.status(500).send({ msg: error.message })
    }
}

const updateProductDetails = async function (req, res) {
    try {
        let data = req.body.data
        let Data = JSON.parse(data)
        let files = req.files
        let productId = req.params.productId

        let { title, description, price, currencyId, currencyFormat, isFreeShipping, productImage, style, availableSizes, installments } = Data
        let detailsToBeUpdated = {}

        if (Object.keys(Data).length == 0) {
            return res.status(400).send({ status: false, msg: "request body can't be empty for update" })
        }
        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, msg: "productId is not a valid objectId" })
        }
        if (Data.hasOwnProperty('title')) {
            if (isValid(title)) {
                let isTitleAlreadyUsed = await ProductModel.findOne({ title })
                if (isTitleAlreadyUsed) {
                    return res.status(400).send({ status: false, msg: "this title is already used please provide another title" })
                } else {
                    detailsToBeUpdated['title'] = title
                }
            }
        }
        if (Data.hasOwnProperty('description')) {
            if (isValid(description)) {
                detailsToBeUpdated['description'] = description
            }
        }
        if (Data.hasOwnProperty('price')) {
            if (typeof (price) == typeof (1)) {
                detailsToBeUpdated['price'] = price
            }
        }
        if (Data.hasOwnProperty('productImage')) {
            if (files && files.length > 0) {
                let productPic = await uploadFile(files[0])
                detailsToBeUpdated['productImage'] = productPic
            }
        }
        if (Data.hasOwnProperty('style')) {
            if (isValid(style)) {
                detailsToBeUpdated['style'] = style
            }
        }
        if (Data.hasOwnProperty('availableSizes')) {
            if (isValid(availableSizes)) {
                if (availableSizes) {
                    for (let i = 0; i < availableSizes.length; i++) {
                        if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(availableSizes[i]))) {
                            return res.status(400).send({ status: false, msg: `Available sizes must be among ${["S", "XS", "M", "X", "L", "XXL", "XL"]}` })
                        }
                    }
                    if (Array.isArray(availableSizes))
                        detailsToBeUpdated['availableSizes'] = availableSizes
                }
            }
        }
        if (Data.hasOwnProperty('installments')) {
            if (typeof (installments) == typeof (1)) {
                detailsToBeUpdated['installments'] = installments
            }
        }

        let updatedProduct = await ProductModel.findOneAndUpdate({ _id: productId, isDeleted: false }, detailsToBeUpdated, { new: true })
        if (!updatedProduct) {
            return res.status(404).send({ status: false, msg: "product not exist with this product id" })
        }
        else {
            return res.status(200).send({ status: true, msg: "details updated successfully", data: updatedProduct })
        }
    }
    catch (error) {
        console.log(error)
        res.status(500).send({ msg: error.message })
    }
}

const deleteProduct = async function (req, res) {
    try {
        let productId = req.params.productId

        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, msg: "productId is not a valid objectId" })
        }
        let productDetails = await ProductModel.findOne({ _id: productId, isDeleted: false })
        if (!productDetails) {
            return res.status(404).send({ status: false, msg: "product with this id not exist or already deleted" })
        }
        let deleteProductDetails = await ProductModel.findOneAndUpdate({ _id: productId, isDeleted: false }, { $set: { isDeleted: true, deletedAt: Date.now() } })
        return res.status(200).send({ status: true, msg: "product is deleted successfully" })
    }
    catch (error) {
        console.log(error)
        res.status(500).send({ msg: error.message })
    }
}


module.exports = { createProduct, getFilterProduct, getProductDetails, updateProductDetails, deleteProduct }