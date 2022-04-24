const productModel = require("../Models/productModel")
const validator = require("../utils/validator")
const aws = require("../utils/aws")




const createProduct = async function (req, res) {
    try {
        let data = req.body.data
        let Data = JSON.parse(data)
        let files = req.files

        let { title, description, price, currencyId, currencyFormat,
            isFreeShipping, style, availableSizes, installments } = Data

        if (Object.keys(Data).length == 0) {
            return res.status(400).send({
                status: false,
                msg: " req body can't be empty, BAD REQUEST"
            })
        }

        if (!validator.isValid(title)) {
            return res.status(400).send({
                status: false,
                msg: "title is required"
            })
        }

        let isTitleAlreadyUsed = await productModel.findOne({ title })
        if (isTitleAlreadyUsed) {
            return res.status(400).send({
                status: false,
                msg: "this title is already used please provide another title"
            })
        }

        if (!validator.isValid(description)) {
            return res.status(400).send({
                status: false,
                msg: "description is required"
            })
        }

        if (!price) {
            return res.status(400).send({
                status: false,
                msg: "price is required"
            })
        }

        if (typeof (price) != typeof (1)) {
            return res.status(400).send({
                status: false,
                msg: "price should be in number"
            })
        }

        if (price < 0) {
            return res.status(400).send({
                status: false,
                msg: "price should be in positive integers"
            })
        }

        if (!validator.isValid(currencyId)) {
            return res.status(400).send({
                status: false,
                msg: "currencyId is required"
            })
        }

        if (currencyId != 'INR') {
            return res.status(400).send({
                status: false,
                msg: "currencyId should be INR"
            })
        }

        if (!validator.isValid(currencyFormat)) {
            return res.status(400).send({
                status: false,
                msg: "currencyFormat is required"
            })
        }

        if (currencyFormat != '₹') {
            return res.status(400).send({
                status: false,
                msg: "currencyFormat should be in ₹"
            })
        }

        if (!files || (files && files.length === 0)) {
            return res.status(400).send({
                status: false,
                msg: "productImage is required"
            })
        }

        if (Data.hasOwnProperty(style)) {
            if (!validator.isValid(style)) {
                return res.status(400).send({
                    status: false,
                    msg: "style data should be a valid data"
                })
            }
        }

        if (!Array.isArray(availableSizes)) {
            return res.status(400).send({
                status: false,
                msg: "availableSizes is required"
            })
        }
        if (availableSizes) {
            for (let i = 0; i < availableSizes.length; i++) {
                if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(availableSizes[i]))) {
                    return res.status(400).send({
                        status: false,
                        msg: `Available sizes must be among ${["S", "XS", "M", "X", "L", "XXL", "XL"]}`
                    })
                }
            }
        }

        if (data.hasOwnProperty(installments)) {
            if (typeof (installments) != typeof (1)) {
                return res.status(400).send({
                    status: false,
                    msg: "installments should be in number"
                })
            }
        }

        else {
            let profilePic = await aws.uploadFile(files[0])
            let productToBeCreated = {
                title, description, price, currencyId, currencyFormat,
                isFreeShipping, productImage: profilePic, style, availableSizes, installments,
            }
            let productCreated = await productModel.create(productToBeCreated)

            return res.status(201).send({
                status: true,
                msg: "product created successfully",
                data: productCreated
            })
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

        if (data.hasOwnProperty("size")) {
            if (validator.isValid(size)) {
                for (let i = 0; i < size.length; i++) {
                    if ((["S", "XS", "M", "X", "L", "XXL", "XL"].includes(size[i]))) {
                        filteredProduct['availableSizes'] = size
                    }
                    else {
                        return res.status(400).send({
                            status: false,
                            msg: "enter size among S,XS,M,X,L,XXL,XL to filter the products"
                        })
                    }
                }
            }
            else {
                return res.status(400).send({
                    status: false,
                    msg: "enter valid size to filter the products"
                })
            }
        }

        if (data.hasOwnProperty("productName")) {
            if (validator.isValid(productName)) {
                filteredProduct['title'] = { $regex: productName }
            }
            else {
                return res.status(400).send({
                    status: false,
                    msg: "enter valid productName to filter products"
                })
            }
        }

        if (data.hasOwnProperty("priceGreaterThan")) {
            if (validator.isValid(priceGreaterThan)) {
                if (!isNaN(priceGreaterThan)) {
                    filteredProduct['price'] = { $gt: priceGreaterThan }
                }
                else {
                    return res.status(400).send({
                        status: false,
                        msg: "priceGreaterThan should be in number to filter products"
                    })
                }
            }
            else {
                return res.status(400).send({
                    status: false,
                    msg: "enter valid number for priceGreaterThan to filter products"
                })
            }
        }

        if (data.hasOwnProperty("priceLessThan")) {
            if (validator.isValid(priceLessThan)) {
                if (!isNaN(priceLessThan)) {
                    filteredProduct['price'] = { $lt: priceLessThan }
                }
                else {
                    return res.status(400).send({
                        status: false,
                        msg: "priceLessThan should be in number to filter products"
                    })
                }
            }
            else {
                return res.status(400).send({
                    status: false,
                    msg: "enter valid priceLessThan to filter the products"
                })
            }
        }

        if (priceGreaterThan && priceLessThan) {
            filteredProduct['price'] = { $gt: priceGreaterThan, $lt: priceLessThan }
        }

        if (data.hasOwnProperty("priceSort")) {
            if (validator.isValid(priceSort)) {
                if (!(priceSort == 1 || priceSort == -1)) {
                    return res.status(400).send({
                        status: false,
                        msg: "you can sort price by value 1 or -1"
                    })
                }
            }
            else {
                return res.status(400).send({
                    status: false,
                    msg: "enter valid priceSort of 1 or -1 to filter products"
                })
            }
        }

        let productDetails = await productModel.find(filteredProduct).sort({ price: priceSort })
        if (productDetails.length == 0) {
            return res.status(404).send({
                status: false,
                msg: "product not exist"
            })
        }
        else {

            return res.status(200).send({
                status: true,
                msg: "product details fetched successfully",
                noOfProducts: productDetails.length,
                data: productDetails
            })
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

        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({
                status: false,
                msg: "productId is not a valid objectId"
            })
        }

        let productDetails = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!productDetails) {
            return res.status(404).send({
                status: false,
                msg: "product not exist with this productId"
            })
        }
        else {
            return res.status(200).send({
                status: true,
                msg: "details fetched successfully",
                data: productDetails
            })
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

        let { title, description, price, isFreeShipping, style, availableSizes, installments } = Data
        let detailsToBeUpdated = {}

        if (Object.keys(Data).length == 0 && files.length == 0) {
            return res.status(400).send({
                status: false,
                msg: "request body can't be empty for update"
            })
        }

        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({
                status: false,
                msg: "productId is not a valid objectId"
            })
        }

        if (Data.hasOwnProperty('title')) {
            if (validator.isValid(title)) {
                let isTitleAlreadyUsed = await productModel.findOne({ title })
                if (isTitleAlreadyUsed) {
                    return res.status(400).send({
                        status:
                            false,
                        msg: "this title is already used please provide another title"
                    })
                }
                else {
                    detailsToBeUpdated['title'] = title
                }
            }
            else {
                return res.status(400).send({
                    status: false,
                    msg: "enter valid title for update"
                })
            }
        }

        if (Data.hasOwnProperty('description')) {
            if (validator.isValid(description)) {
                detailsToBeUpdated['description'] = description
            }
            else {
                return res.status(400).send({
                    status: false,
                    msg: "enter valid description for update"
                })
            }
        }

        if (Data.hasOwnProperty('price')) {
            if (typeof (price) == typeof (1)) {
                detailsToBeUpdated['price'] = price
            }
            else {
                return res.status(400).send({
                    status: false,
                    msg: "enter valid price in number for update"
                })
            }
        }

        if (data.includes(isFreeShipping)) {
            if (isFreeShipping == true || isFreeShipping == false) {
                detailsToBeUpdated['isFreeShipping'] = isFreeShipping
            }
            else {
                return res.status(400).send({
                    status: false,
                    msg: "enter only Boolean value for isFreeShipping for update"
                })
            }
        }

        if (Data.hasOwnProperty('productImage')) {
            if (files && files.length > 0) {
                let productPic = await aws.uploadFile(files[0])
                detailsToBeUpdated['productImage'] = productPic
            }
            else {
                return res.status(400).send({
                    status: false,
                    msg: "enter valid files for profileImage update"
                })
            }
        }

        if (Data.hasOwnProperty('style')) {
            if (validator.isValid(style)) {
                detailsToBeUpdated['style'] = style
            }
            else {
                return res.status(400).send({
                    status: false,
                    msg: "enter valid style for update"
                })
            }
        }

        if (data.includes("availableSizes")) {
            if (Array.isArray(availableSizes)) {
                for (let i = 0; i < availableSizes.length; i++) {
                    if ((["S", "XS", "M", "X", "L", "XXL", "XL"].includes(availableSizes[i]))) {
                        detailsToBeUpdated['availableSizes'] = availableSizes
                    }
                    else {
                        return res.status(400).send({
                            status: false,
                            msg: "enter size among S,XS,M,X,L,XXL,XL to update the size of products"
                        })
                    }
                }
            }
            else {
                return res.status(400).send({
                    status: false,
                    msg: "enter valid size in array to update the products"
                })
            }
        }

        if (Data.hasOwnProperty('installments')) {
            if (typeof (installments) == typeof (1)) {
                detailsToBeUpdated['installments'] = installments
            }
            else {
                return res.status(400).send({
                    status: false,
                    msg: "enter valid numbers for update the installment of product"
                })
            }
        }

        let updatedProduct = await productModel.findOneAndUpdate({
            _id: productId,
            isDeleted: false
        },
            detailsToBeUpdated, { new: true })
        if (!updatedProduct) {
            return res.status(404).send({
                status: false,
                msg: "product not exist with this product id"
            })
        }
        else {
            return res.status(200).send({
                status: true,
                msg: "details updated successfully",
                data: updatedProduct
            })
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

        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({
                status: false,
                msg: "productId is not a valid objectId"
            })
        }

        let productDetails = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!productDetails) {
            return res.status(404).send({
                status: false,
                msg: "product with this id not exist or already deleted"
            })
        }

        let deleteProductDetails = await productModel.findOneAndUpdate({
            _id: productId,
            isDeleted: false
        },
            { $set: { isDeleted: true, deletedAt: Date.now() } })

        return res.status(200).send({
            status: true,
            msg: "product is deleted successfully"
        })

    }
    catch (error) {
        console.log(error)
        res.status(500).send({ msg: error.message })
    }
}


module.exports = { createProduct, getFilterProduct, getProductDetails, updateProductDetails, deleteProduct }