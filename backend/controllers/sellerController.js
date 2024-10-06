const Seller = require('../models/seller');
const Product = require('../models/product');


// Update
const updateSeller = async (req, res) => {
    try {
        console.log("hiixxx")

        const seller1 = await Seller.findById(req.params.id);
        console.log("hii",seller1.isAccepted)

        if(!seller1.isAccepted){
            return res.status(400).json({ error: 'Seller is not accepted yet, Can not update profile' });
        }
        const { email, username, name, description} = req.body;
        const seller = await Seller.findByIdAndUpdate(req.params.id, { email, username, name, description}, { new: true });



        if (!seller) {
            return res.status(404).json({ error: 'Seller not found' });
        }
        res.status(200).json({ message: 'Seller profile updated', seller });
    } catch (error) {
        console.log(error);
        res.status(400).json({ error: 'Error updating seller profile' });
    }
};

const deleteSellerAccount = async (req, res) => {
    try {
        const seller = await Seller.findByIdAndDelete(req.params.id);
        if (!seller) {
            return res.status(404).json({ message: 'Seller not found' });
        }

        // Delete all products associated with the seller
        await Product.deleteMany({ seller: seller._id });

        res.status(201).json({ message: 'Seller and associated products deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



const getAllSellers = async (req, res) => {
    try {
        const seller = await Seller.find();
        res.status(200).json(seller);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getSellerByID = async (req, res) => {
    try {
        const seller = await Seller.findById(req.params.id);
        if (!seller) {
            return res.status(404).json({ message: 'Seller not found' });
        }
        res.status(200).json(seller);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getSeller = async (req, res) => {
    try {
        const seller = await Seller.findById(res.locals.user_id);
        if (!seller) {
            return res.status(404).json({ message: 'Seller not found' });
        }
        res.status(200).json(seller);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { deleteSellerAccount, getAllSellers, getSellerByID, updateSeller, getSeller };
