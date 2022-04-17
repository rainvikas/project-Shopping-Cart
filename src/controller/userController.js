const UserModel = require("../model/userModel")
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId
const bcrypt = require('bcrypt')
let saltRounds = 10
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
            Key: "Group/" + file.originalname,
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

const createUser = async function (req, res) {
    try {
        let data = req.body.data
        let Data = JSON.parse(data)
        let files = req.files

        let { fname, lname, email, phone, profileImage, password, address } = Data

        if (Object.keys(Data).length == 0) {
            return res.status(400).send({ status: false, msg: "request body can't be empty, BAD REQUEST" })
        }
        if (!isValid(fname)) {
            return res.status(400).send({ status: false, msg: "fname is required" })
        }
        if (!isValid(lname)) {
            return res.status(400).send({ status: false, msg: "lname is required" })
        }
        if (!isValid(email)) {
            return res.status(400).send({ status: false, msg: "email is required" })
        }
        if (!(/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(email))) {
            return res.status(400).send({ status: false, msg: "email is not is proper format or email is invalid" })
        }
        if (!isValid(phone)) {
            return res.status(400).send({ status: false, msg: "phone is required" })
        }
        if (!(/^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/.test(phone))) {
            return res.status(400).send({ status: false, msg: "phone number is not valid please enter max 10 digit you can include +91,0,91 before 10 digit no" })
        }
        if (!files || (files && files.length === 0)) {
            return res.status(400).send({ status: false, msg: "profileImage is required" })
        }

        if (!isValid(password)) {
            return res.status(400).send({ status: false, msg: "passsword is required" })
        }

        if (password.length < 8 || password.length > 16) {
            return res.status(400).send({ status: false, msg: "password should be min 8 and max 16" })
        }
        if (!isValid(address)) {
            return res.status(400).send({ status: false, msg: "address is required" })
        }
        if (address) {
            if (!isValid(address.shipping.street)) {
                return res.status(400).send({ status: false, msg: "shipping street is required" })
            }
            if (!isValid(address.shipping.city)) {
                return res.status(400).send({ status: false, msg: "shipping city is required" })
            }
            if (!address.shipping.pincode) {
                return res.status(400).send({ status: false, msg: "shipping pincode is required" })
            }
            if (typeof (address.shipping.pincode) != typeof (1)) {
                return res.status(400).send({ status: false, msg: "shipping pincode should be in number" })
            }
            if (address.shipping.pincode.length > 6 || address.shipping.pincode.length < 6) {
                return res.status(400).send({ status: false, msg: "shipping pincode should consist of 6 digit" })
            }
            if (!isValid(address.billing.street)) {
                return res.status(400).send({ status: false, msg: "billing street is required" })
            }
            if (!isValid(address.billing.city)) {
                return res.status(400).send({ status: false, msg: "billing city is required" })
            }
            if (!address.billing.pincode) {
                return res.status(400).send({ status: false, msg: "billing pincode is required" })
            }
            if (typeof (address.shipping.pincode) != typeof (1)) {
                return res.status(400).send({ status: false, msg: "billing password should be in number" })
            }
            if (address.billing.pincode.length > 6 || address.billing.pincode.length < 6) {
                return res.status(400).send({ status: false, msg: "billing pincode should consist of 6 digit" })
            }
        }

        let isEmailAlreadyUsed = await UserModel.findOne({ email })
        if (isEmailAlreadyUsed) {
            return res.status(400).send({ status: false, msg: "this email already exist please enter another email" })
        }
        let isPhoneAlreadyUsed = await UserModel.findOne({ phone })
        if (isPhoneAlreadyUsed) {
            return res.status(400).send({ status: false, msg: "this phone already exist please enter another phone" })
        }
        let profilePic = await uploadFile(files[0])
        let hash = bcrypt.hashSync(password.toString(), saltRounds)
        let dataToBeCreated = { fname, lname, email, phone, password: hash, profileImage: profilePic, address }
        let userData = await UserModel.create(dataToBeCreated)
        return res.status(201).send({ status: true, msg: "user created successfully", data: userData })

    }
    catch (error) {
        console.log(error)
        res.status(500).send({ msg: error.message })
    }
}

const loginUser = async function (req, res) {
    try {
        let data = req.body
        let { email, password } = data

        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, msg: "request body must contain some valid data" })
        }
        if (!(isValid(email) && isValid(password))) {
            res.status(400).send({ status: false, msg: "email and password both is required" })
            return
        }
        if (!(/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(email))) {
            return res.status(400).send({ status: false, msg: "email should be valid email address" }) 
        }
        if (password.length < 8 || password.length > 16) {
            return res.status(400).send({ status: false, msg: "password should be min 8 and max 16" })
        }

        let User = await UserModel.findOne({ email: email })
        if (User) {
            const Passwordmatch = bcrypt.compareSync(data.password, User.password)
            if (Passwordmatch) {
                let token = jwt.sign({ userId: User._id, exp: Math.floor(Date.now() / 1000) + (60 * 60) }, "Group-19")
                res.setHeader("x-api-key", token);
                let details = { userId: User._id, token: token }
                return res.status(200).send({ status: true, msg: "user login successfull", data: details })
            }
            else {
                return res.status(404).send({ status: false, msg: "password is not matched" })
            }
        }

    }
    catch (error) {
        console.log("This is the error:", error.message)
        res.status(500).send({ msg: "server error", err: error })
    }

}

const getUserDetails = async function (req, res) {
    try {
        let userId = req.params.userId

        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, msg: "userId is not a valid objectId" })
        }
        let userDetails = await UserModel.findOne({ _id: userId })
        if (!userDetails) {
            return res.status(404).send({ status: false, msg: "no user exist with this userId" })
        }
        else {
            return res.status(200).send({ status: true, msg: "user profile details", data: userDetails })
        }
    }
    catch (error) {
        console.log("This is the error:", error.message)
        res.status(500).send({ msg: "server error", err: error })
    }
}


const updateUserDetails = async function (req, res) {
    try {
        let data = req.body.data
        let Data = JSON.parse(data)
        let files = req.files
        let userId = req.params.userId

        let { fname, lname, email, phone, profileImage, password, address } = Data
        let detailsToBeUpdated = {}

        if (Object.keys(Data).length == 0) {
            return res.status(400).send({ status: false, msg: "for update request body can't empty" })
        }
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, msg: "userId is not a valid objectId" })
        }
        if (Data.hasOwnProperty('fname')) {
            if (isValid(fname)) {
                
                detailsToBeUpdated['fname'] = fname
            }
        }
        if (Data.hasOwnProperty('lname')) {
            if (isValid(lname)) {
                detailsToBeUpdated['lname'] = lname
            }
        }
        if (Data.hasOwnProperty('email')) {
            if (isValid(email) && (/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(email))) {
                let isEmailAlreadyUsed = await UserModel.findOne({ email })
                if (isEmailAlreadyUsed) {
                    return res.status(400).send({ status: false, msg: "this email is already used please enter another email" })
                }
                else {
                    detailsToBeUpdated['email'] = email
                }
            }
        }
        if (Data.hasOwnProperty('phone')) {
            if (isValid(phone) && (/^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/.test(phone))) {
                let isPhoneAlreadyUsed = await UserModel.findOne({ phone })
                if (isPhoneAlreadyUsed) {
                    return res.status(400).send({ status: false, msg: "this phone is already used please use another phone" })
                }
                else {
                    detailsToBeUpdated['phone'] = phone
                }
            }
        }
        if (Data.hasOwnProperty('profileImage')) {
            if (files && files.length > 0) {
                let profilePic = await uploadFile(files[0])
                detailsToBeUpdated['profileImage'] = profileImage
            }
        }
        if (Data.hasOwnProperty('password')) {
            if (typeof (password) == typeof (1)) {
                let hash = bcrypt.hashSync(password.toString(), saltRounds)
                detailsToBeUpdated['password'] = hash
            }
        }

        let userDetailsToBeUpdated = await UserModel.findOneAndUpdate({ _id: userId, isDeleted: true }, detailsToBeUpdated, { new: true })
        if (!userDetailsToBeUpdated) {
            return res.status(400).send({ status: false, msg: "user not found with this id" })
        }
        else {
            return res.status(200).send({ status: true, msg: "user details updated successfully", data: userDetailsToBeUpdated })
        }
    }
    catch (error) {
        console.log("This is the error:", error.message)
        res.status(500).send({ msg: "server error", err: error })
    }
}
module.exports = { createUser, loginUser, getUserDetails, updateUserDetails }