const mongoose = require('mongoose')



const userSchema = new mongoose.Schema({
    fname : {type: String,required: true,trim:true},

    lname: {type: String,required: true, trim: true},

    email: {type: String,lowercase: true, required: true,unique: true,
        match: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
    },
    profileImage: {type: String,required: true,
        match: /(s3-|s3\.)?(.*)\.amazonaws\.com/g
    },
    phone: {type: String,required: true,unique: true,trim: true,
        match: /^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/
    },
    password: {type: String,required: true,trim: true},
    
    address: {
        shipping: {
            street: {type: String, required: true},
            city: {type: String,required: true},
            pincode: {type: Number,required: true}
        },
        billing: {
            street: {type: String,required: true},
            city: {type: String,required: true},
            pincode: {type: Number,required: true}
        }
    },
},{timestamps: true});

module.exports = mongoose.model('user', userSchema)