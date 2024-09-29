const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');
const TourismGovernor = require('../models/tourismGovernor');
const Tourist = require('../models/tourist');
const Seller = require('../models/seller');
const Advertiser = require('../models/advertiser');
const TourGuide = require('../models/tourGuide');



const createToken = (id,role) => {
    return jwt.sign({ id ,role}, process.env.SECRET, {
        expiresIn: process.env.EXPIRES_IN
    });
}

const touristSignup = async (req, res) => {
    try{
        if(await emailExists(req.body.email)){
            throw new Error('Email already exists');
        }
        const { email, username, password, nationality, mobile, dateOfBirth, jobOrStudent} = req.body;
        const tourist = new Tourist({ email, username, password, nationality, mobile, dateOfBirth, jobOrStudent});

        tourist.save()
            .then((result) => {
                res.status(201).json({ tourist: result });
            })
            .catch((err) => {
                res.status(400).json({ message: err.message });
                console.log(err);
            });
    }catch(err){
        res.status(400).json({ message: err.message });
    }
}

const login = async (req, res) => {
    const { email, username, password } = req.body;

    try {
        let role = '';
        let user = null;
        if(await Tourist.findOne({email})){
            role = 'tourist';
            user = await Tourist.login(email, password);
        }
        else if(await TourGuide.findOne({email})){
            role = 'tour-guide';
            user = await TourGuide.login(email, password);
        }
        else if(await Advertiser.findOne({email})){
            role = 'advertiser';
            user = await Advertiser.login(email, password);
        }
        else if(await Seller.findOne({email})){
            role = 'seller';
            user = await Seller.login(email, password);
        }
        else if(await Admin.findOne({username})){
            role = 'admin';
            user = await Admin.login(username, password);
        }
        else if(await TourismGovernor.findOne({username})){
            role = 'tourism-governor';
            user = await TourismGovernor.login(username, password);
        }
        else{
            res.cookie('jwt', '', { maxAge: 1 });
            throw new Error('Email not found');
        }

        const token = createToken(user._id,role);
        res.cookie('jwt', token, { httpOnly: false, maxAge: process.env.MAX_AGE*1000});
        res.setHeader('Authorization', `Bearer ${token}`);
        res.status(200).json({ message: 'Login succesful', role });
    } catch (error) {
        res.cookie('jwt', '', { maxAge: 1 });
        res.status(400).json({ message: error.message });
    }
}

const advertiserSignup = async (req, res) => {
    try{
        if(await emailExists(req.body.email)){
            throw new Error('Email already exists');
        }
        const advertiser = new Advertiser(req.body);

        advertiser.save()
            .then((result) => {
                res.status(201).json({ advertiser: result });
            })
            .catch((err) => {
                res.status(400).json({ message: err.message });
                console.log(err);
            });
    }catch(err){
        res.status(400).json({ message: err.message });
    }
}


const tourGuideSignup = async (req, res) => {
    try{
        if(await emailExists(req.body.email)){
            throw new Error('Email already exists');
        }
        const tourGuide = new TourGuide(req.body);

        tourGuide.save()
            .then((result) => {
                res.status(201).json({ tourGuide: result });
            })
            .catch((err) => {
                res.status(400).json({ message: err.message });
                console.log(err);
            });
    }catch(err){
        res.status(400).json({ message: err.message });
    }
}

const sellerSignup = async (req, res) => {
    try{
        if(await emailExists(req.body.email)){
            throw new Error('Email already exists');
        }
        const seller = new Seller(req.body);

        seller.save()
            .then((result) => {
                res.status(201).json({ Seller: result });
            })
            .catch((err) => {
                res.status(400).json({ message: err.message });
                console.log(err);
            });
    }catch(err){
        res.status(400).json({ message: err.message });
    }
}



const logout = (req, res) => {
    res.cookie('jwt', '', { maxAge: 1 });
    res.json({ message: 'Logout successful' });
}

const emailExists = async (email) => {
    if(await Tourist.findOne({email})){
        return true;
    }
    else if(await TourGuide.findOne({email})){
        return true;
    }
    else if(await Advertiser.findOne({email})){
        return true;
    }
    else if(await Seller.findOne({email})){
        return true;
    }
    else{
        return false;
    }
}


module.exports = { touristSignup,  advertiserSignup, tourGuideSignup, sellerSignup, login, logout };