const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const UserModel = require("../model/userModel")

const isValidObjectId = function (objectId) {
    return mongoose.Types.ObjectId.isValid(objectId)
}

const authentication = function (req, res, next) {
    try {
        let token = req.headers["x-api-key"]
        if (!token) {
            res.status(401).send({ status: false, msg: " token is required" })
        }

        let decodedToken = jwt.verify(token, "Group-19",{ ignoreExpiration: true })
        if (!decodedToken) {
            return res.status(401).send({ status: false, msg: "token is invalid" })
        }
        let timeToExpire = Math.floor(Date.now() / 1000)
        if (decodedToken.exp < timeToExpire) {
            return res.status(401).send({ status: false, msg: "token is expired please login again" })
        }
        next()
    }
    catch (error) {
        console.log(error)
        res.status(500).send({ msg: error })
    }
}

let authorization = async function (req, res, next) {
    try {
        let userId = req.params.userId

        if (!isValidObjectId(userId)) {
            res.status(400).send({ status: false, msg: " bookId is not a valid ObjectId" })
        }
        let token = req.headers["x-api-key"]
        let decodedToken = jwt.verify(token, "Group-19")
        let userDetails = await UserModel.findOne({ _id: userId })
        if (!userDetails) {
            return res.status(404).send({ status: false, msg: "id not found" })
        }
        if (decodedToken.userId != userDetails._id) {
            return res.status(403).send({ status: false, msg: "you are not authorized" })
        }
        next()
    }
    catch (error) {
        console.log(error)
        res.status(500).send({ msg: error })
    }
}

module.exports = {authentication, authorization}