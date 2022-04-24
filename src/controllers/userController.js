const userModel = require("../Models/userModel")
const validator = require("../utils/validator")
const aws = require("../utils/aws")
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
let saltRounds = 10



const createUser = async function (req, res) {
    try {
        let data = req.body.data
        let Data = JSON.parse(data)
        let files = req.files

        let { fname, lname, email, phone, password, address } = Data

        if (Object.keys(Data).length == 0) {
            return res.status(400).send({
                status: false,
                msg: "request body can't be empty, BAD REQUEST"
            })
        }

        if (!validator.isValid(fname)) {
            return res.status(400).send({
                status: false,
                msg: "fname is required"
            })
        }

        if (!validator.isValid(lname)) {
            return res.status(400).send({
                status: false,
                msg: "lname is required"
            })
        }

        if (!validator.isValid(email)) {
            return res.status(400).send({
                status: false,
                msg: "email is required"
            })
        }

        if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))) {
            return res.status(400).send({
                status: false,
                msg: "email is invalid"
            })
        }

        let isEmailAlreadyUsed = await userModel.findOne({ email })
        if (isEmailAlreadyUsed) {
            return res.status(400).send({
                status: false,
                msg: "this email is already exist please enter another email"
            })
        }

        if (!validator.isValid(phone)) {
            return res.status(400).send({
                status: false,
                msg: "phone is required"
            })
        }

        if (!(/^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/.test(phone))) {
            return res.status(400).send({
                status: false,
                msg: "phone number is not valid please enter max 10 digit you can include +91,0,91 before 10 digit no"
            })
        }

        let isPhoneAlreadyUsed = await userModel.findOne({ phone })
        if (isPhoneAlreadyUsed) {
            return res.status(400).send({
                status: false,
                msg: "this phone no. already exist please enter another phone no."
            })
        }

        if (!files || (files && files.length === 0)) {
            return res.status(400).send({
                status: false,
                msg: "profileImage is required"
            })
        }

        if (!validator.isValid(password)) {
            return res.status(400).send({
                status: false,
                msg: "passsword is required"
            })
        }

        if (password.length < 8 || password.length > 16) {
            return res.status(400).send({
                status: false,
                msg: "password should be min 8 and max 16"
            })
        }

        if (!validator.isValid(address)) {
            return res.status(400).send({
                status: false,
                msg: "address is required"
            })
        }

        if (address) {
            if (!validator.isValid(address.shipping.street)) {
                return res.status(400).send({
                    status: false,
                    msg: "shipping street is required"
                })
            }

            if (!validator.isValid(address.shipping.city)) {
                return res.status(400).send({
                    status: false,
                    msg: "shipping city is required"
                })
            }

            if (!address.shipping.pincode) {
                return res.status(400).send({
                    status: false,
                    msg: "shipping pincode is required"
                })
            }

            if (address.shipping.pincode.toString().length && typeof (address.shipping.pincode) != typeof (1)) {
                return res.status(400).send({
                    status: false,
                    msg: "shipping pincode should be in number"
                })
            }

            if (!validator.isValid(address.billing.street)) {
                return res.status(400).send({
                    status: false,
                    msg: "billing street is required"
                })
            }

            if (!validator.isValid(address.billing.city)) {
                return res.status(400).send({
                    status: false,
                    msg: "billing city is required"
                })
            }

            if (!address.billing.pincode) {
                return res.status(400).send({
                    status: false,
                    msg: "billing pincode is required"
                })
            }

            if (address.billing.pincode.toString().length && typeof (address.billing.pincode) != typeof (1)) {
                return res.status(400).send({
                    status: false,
                    msg: "billing password should be in number"
                })
            }
        }

        let profilePic = await aws.uploadFile(files[0])
        let hash = bcrypt.hashSync(password.toString(), saltRounds)
        let dataToBeCreated = { fname, lname, email, phone, password: hash, profileImage: profilePic, address }
        let userData = await userModel.create(dataToBeCreated)

        return res.status(201).send({
            status: true,
            msg: "user created successfully",
            data: userData
        })

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
            return res.status(400).send({
                status: false,
                msg: "request body can't be empty, BAD REQUEST"
            })
        }

        if (!(validator.isValid(email) && validator.isValid(password))) {
            return res.status(400).send({
                status: false,
                msg: "email and password both is required"
            })
        }

        if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))) {
            return res.status(400).send({
                status: false,
                msg: "email should be valid email address"
            })
        }

        if (password.length < 8 || password.length > 16) {
            return res.status(400).send({
                status: false,
                msg: "password should be min 8 and max 16"
            })
        }

        let User = await userModel.findOne({ email: email })
        if (User) {
            const Passwordmatch = bcrypt.compareSync(data.password, User.password)
            if (Passwordmatch) {
                let token = jwt.sign({ userId: User._id, exp: Math.floor(Date.now() / 1000) + (60 * 60) }, "Group-19")
                let details = { userId: User._id, token: token }

                return res.status(200).send({
                    status: true,
                    msg: "login is successfull",
                    data: details
                })
            }

            else {
                return res.status(404).send({
                    status: false,
                    msg: "password not found"
                })
            }
        }
        return res.status(404).send({
            status: false,
            msg: "email not found"
        })

    }
    catch (error) {
        console.log("This is the error:", error.message)
        res.status(500).send({ msg: "server error", err: error })
    }

}

const getUserDetails = async function (req, res) {
    try {
        let userId = req.params.userId

        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({
                status: false,
                msg: "userId is not a valid objectId"
            })
        }

        let userDetails = await userModel.findOne({ _id: userId })
        if (!userDetails) {
            return res.status(404).send({
                status: false,
                msg: "no user exist with this userId"
            })
        }
        else {
            return res.status(200).send({
                status: true,
                msg: "user profile details",
                data: userDetails
            })
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

        let { fname, lname, email, phone, password, address } = Data
        let detailsToBeUpdated = {}

        if (Object.keys(Data).length == 0 && files.length == 0) {
            return res.status(400).send({
                status: false,
                msg: "request body can't be empty, BAD REQUEST"
            })
        }

        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({
                status: false,
                msg: "userId is not a valid objectId"
            })
        }

        if (Data.hasOwnProperty('fname')) {
            if (validator.isValid(fname)) {
                detailsToBeUpdated['fname'] = fname
            }
            else {
                return res.status(400).send({
                    status: false,
                    msg: "enter valid fname for update"
                })
            }
        }

        if (Data.hasOwnProperty('lname')) {
            if (validator.isValid(lname)) {
                detailsToBeUpdated['lname'] = lname
            }
            else {
                return res.status(400).send({
                    status: false,
                    msg: "enter valid lname for update"
                })
            }
        }

        if (Data.hasOwnProperty('email')) {
            if (validator.isValid(email) && (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))) {
                let isEmailAlreadyUsed = await userModel.findOne({ email })
                if (isEmailAlreadyUsed) {
                    return res.status(400).send({
                        status: false,
                        msg: "this email is already used please enter another email"
                    })
                }
                detailsToBeUpdated['email'] = email
            }
            else {
                return res.status(400).send({
                    status: false,
                    msg: "enter valid emailId for update"
                })
            }
        }

        if (Data.hasOwnProperty('phone')) {
            if (validator.isValid(phone) && (/^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/.test(phone))) {
                let isPhoneAlreadyUsed = await userModel.findOne({ phone })
                if (isPhoneAlreadyUsed) {
                    return res.status(400).send({
                        status: false,
                        msg: "this phone is already used please use another phone"
                    })
                }
                detailsToBeUpdated['phone'] = phone
            }
            else {
                return res.status(400).send({
                    status: false,
                    msg: "enter valid phone no. for update"
                })
            }
        }

        if (Data.hasOwnProperty('profileImage')) {
            if (files && files.length > 0) {
                let profilePic = await aws.uploadFile(files[0])
                detailsToBeUpdated['profileImage'] = profilePic
            }
            else {
                return res.status(400).send({
                    status: false,
                    msg: "enter valid file to update profileImage"
                })
            }
        }

        if (Data.hasOwnProperty('password')) {
            if (validator.isValid(password) && password.length > 8 && password.length < 17) {
                let hash = bcrypt.hashSync(password, saltRounds)
                detailsToBeUpdated['password'] = hash
            }
            else {
                return res.status(400).send({
                    status: false,
                    msg: "enter valid password of min length 8 and max length 16 for update"
                })
            }
        }

        if (Data.hasOwnProperty("address")) {

            if (address.hasOwnProperty("shipping")) {
                let shipping = address.shipping

                let street = address.shipping.street
                if (shipping.hasOwnProperty("street")) {
                    if (!validator.isValid(street)) {
                        return res.status(400).send({
                            status: false,
                            msg: "please enter valid address of shipping street"
                        })
                    }
                    detailsToBeUpdated["address.shipping.street"] = street
                }

                let city = address.shipping.city
                if (shipping.hasOwnProperty("city")) {
                    if (!validator.isValid(city)) {
                        return res.status(400).send({
                            status: false,
                            msg: "please enter valid address of shipping city"
                        })
                    }
                    detailsToBeUpdated["address.shipping.city"] = city
                }

                let pincode = address.shipping.pincode
                if (shipping.hasOwnProperty("pincode")) {
                    if (pincode.toString().length != 6 || typeof (pincode) != typeof (1)) {
                        return res.status(400).send({
                            status: false,
                            msg: "pincode should be in number and of 6 digits only"
                        })
                    }
                    detailsToBeUpdated["address.shipping.pincode"] = pincode
                }
            }

            if (address.hasOwnProperty("billing")) {
                let billing = address.billing

                let street = address.billing.street
                if (billing.hasOwnProperty("street")) {
                    if (!validator.isValid(street)) {
                        return res.status(400).send({
                            status: false,
                            msg: "please enter valid address of billing street"
                        })
                    }
                    detailsToBeUpdated["address.billing.street"] = street
                }

                let city = address.billing.city
                if (billing.hasOwnProperty("city")) {
                    if (!validator.isValid(city)) {
                        return res.status(400).send({
                            status: false,
                            msg: "please enter valid address of billing city"
                        })
                    }
                    detailsToBeUpdated["address.billing.city"] = city
                }

                let pincode = address.billing.pincode
                if (billing.hasOwnProperty("pincode")) {
                    if (pincode.toString().length != 6 || typeof (pincode) != typeof (1)) {
                        return res.status(400).send({
                            status: false,
                            msg: "pincode should be in number and of 6 digits only"
                        })
                    }
                    detailsToBeUpdated["address.billing.pincode"] = pincode
                }
            }

        }

        let userDetailsToBeUpdated = await userModel.findOneAndUpdate({
            _id: userId,
            isDeleted: false
        },
            detailsToBeUpdated,
            { new: true })

        if (!userDetailsToBeUpdated) {
            return res.status(404).send({
                status: false,
                msg: "user not found with this id"
            })
        }

        else {
            return res.status(200).send({
                status: true,
                msg: "user details updated successfully",
                data: userDetailsToBeUpdated
            })
        }

    }
    catch (error) {
        console.log("This is the error:", error.message)
        res.status(500).send({ msg: "server error", err: error })
    }
}
module.exports = { createUser, loginUser, getUserDetails, updateUserDetails }