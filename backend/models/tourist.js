const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;

const touristSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/.+@.+\..+/, 'Please enter a valid email address']
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 8,
        match: [
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/, 
            'Password must contain at least 8 characters, including at least one uppercase letter, one lowercase letter, one number'
        ]
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long']
    },
    mobile: {
        type: String,
        required: true,
        trim: true,
        match: [/^\+\d{1,3}\d{7,15}$/, 'Please enter a valid phone number with a country code and 7 to 15 digits.']
    },
    nationality: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Nationality',
        required: true,
        trim: true
    },
    dateOfBirth: {
        type: Date,
        required: true,
        immutable: true
    },
    jobOrStudent: {
        type: String,
        required: true,
        trim: true
    },
    wallet: {
        type: Number,
        default: 0
    },
    loyaltyPoints: {
        type: Number,
        default: 0
    },
    loyaltyBadge: {
        type: String,
        enum: ['Bronze', 'Silver', 'Gold'],
    }
}, { timestamps: true });

touristSchema.pre('save', async function(next) {
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

touristSchema.statics.login = async function(username,password){
    let tourist = await this.findOne({username});
    if(tourist===null || tourist===undefined){
        tourist = await this.findOne({email:username});
    }
    
    if(tourist){
        const auth = await bcrypt.compare(password, tourist.password )
        if(auth){
            return tourist;
        }
        throw Error('Incorrect password');
    }
    throw Error("Email/Username is not registered");
}

const Tourist = mongoose.model('Tourist', touristSchema);
module.exports = Tourist;