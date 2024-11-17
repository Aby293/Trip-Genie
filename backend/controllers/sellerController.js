const Seller = require("../models/seller");
const Product = require("../models/product");
const Tourist = require("../models/tourist");
const TourGuide = require("../models/tourGuide");
const Advertiser = require("../models/advertiser");
const Admin = require("../models/admin");
const TourismGovernor = require("../models/tourismGovernor");
const Purchase = require("../models/purchase");
const cloudinary = require("../utils/cloudinary");
const ProductSales = require("../models/productSales");

// Update
const updateSeller = async (req, res) => {
  try {
    const seller1 = await Seller.findById(res.locals.user_id).lean();

    if (!seller1.isAccepted) {
      return res
        .status(400)
        .json({ error: "Seller is not accepted yet, Can not update profile" });
    }
    const { name, description, mobile } = req.body;
    let { email, username } = req.body;
    email = email.toLowerCase();
    username = username.toLowerCase();
    let logo = req.body.logo ? JSON.parse(req.body.logo) : undefined;

    if (username !== seller1.username && (await usernameExists(username))) {
      return res.status(400).json({ message: "Username already exists" });
    }
    if (email !== seller1.email && (await emailExists(email))) {
      return res.status(400).json({ message: "Email already exists" });
    }

    if (logo === undefined) {
      logo = null;
      if (seller1.logo !== null) {
        await cloudinary.uploader.destroy(seller1.logo.public_id);
      }
    } else if (logo.public_id === undefined) {
      const result = await cloudinary.uploader.upload(logo, {
        folder: "logos",
      });
      if (seller1.logo !== null) {
        await cloudinary.uploader.destroy(seller1.logo.public_id);
      }
      logo = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    }

    const seller = await Seller.findByIdAndUpdate(
      res.locals.user_id,
      { email, username, name, description, mobile, logo },
      { new: true }
    );

    if (!seller) {
      return res.status(404).json({ error: "Seller not found" });
    }
    res.status(200).json({ message: "Seller profile updated", seller });
  } catch (error) {
    console.log(error);
    res
      .status(400)
      .json({ error: "Error updating seller profile", message: error.message });
  }
};
const getUnacceptedSeller = async (req, res) => {
  try {
    const unacceptedSellers = await Seller.find({ isAccepted: false });
    res.status(200).json(unacceptedSellers);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching unaccepted Sellers",
      error: error.message,
    });
  }
};

const deleteSellerAccount = async (req, res) => {
  try {
    const seller = await Seller.findById(res.locals.user_id).lean();
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    const products = await Product.find({ seller: res.locals.user_id });
    const productIDs = products.map((product) => product._id.toString());
    const purchases = await Purchase.find({ status: "pending" }).populate(
      "products.product"
    );

    for (const purchase of purchases) {
      if (
        purchase.products.some((prod) =>
          productIDs.includes(prod.product._id.toString())
        )
      ) {
        return res.status(400).json({
          message: "Cannot delete seller account, there are pending purchases",
        });
      }
    }

    products.forEach(async (product) => {
      await Product.findByIdAndUpdate(product._id, { isDeleted: true });
    });

    if (seller.logo !== null) {
      await cloudinary.uploader.destroy(seller.logo.public_id);
    }

    const gfs = req.app.locals.gfs;
    if (!gfs) {
      return res.status(500).send("GridFS is not initialized");
    }
    const fileNames = [
      seller.files.IDFilename,
      seller.files.taxationRegistryCardFilename,
    ];
    const files = await gfs.find({ filename: { $in: fileNames } }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ err: "No file exists" });
    }
    files.forEach(async (file) => {
      await gfs.delete(file._id);
    });
    throw new Error("test");

    await Seller.findByIdAndDelete(res.locals.user_id);

    res.status(200).json({ message: "Seller account deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteSeller = async (req, res) => {
  try {
    const { id } = req.params;
    const seller = await Seller.findById(id).lean();
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    const products = await Product.find({ seller: id });
    const productIDs = products.map((product) => product._id.toString());
    const purchases = await Purchase.find({ status: "pending" }).populate(
      "products.product"
    );
    for (const purchase of purchases) {
      if (
        purchase.products.some((prod) =>
          productIDs.includes(prod.product._id.toString())
        )
      ) {
        return res.status(400).json({
          message: "Cannot delete seller account, there are pending purchases",
        });
      }
    }

    products.forEach(async (product) => {
      await Product.findByIdAndUpdate(product._id, { isDeleted: true });
    });

    if (seller.logo !== null) {
      await cloudinary.uploader.destroy(seller.logo.public_id);
    }

    const gfs = req.app.locals.gfs;
    if (!gfs) {
      return res.status(500).send("GridFS is not initialized");
    }
    const fileNames = [
      seller.files.IDFilename,
      seller.files.taxationRegistryCardFilename,
    ];
    const files = await gfs.find({ filename: { $in: fileNames } }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ err: "No file exists" });
    }
    files.forEach(async (file) => {
      await gfs.delete(file._id);
    });

    await Seller.findByIdAndDelete(id);

    res.status(200).json({ message: "Seller account deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const rejectSeller = async (req, res) => {
  const { id } = req.params;
  try {
    const seller = await Seller.findByIdAndDelete(id);
    if (!seller) {
      return res.status(400).json({ message: "Seller not found" });
    }
    const gfs = req.app.locals.gfs;

    if (!gfs) {
      return res.status(500).send("GridFS is not initialized");
    }

    const filenames = [];
    filenames.push(seller.files.IDFilename);
    filenames.push(seller.files.taxationRegistryCardFilename);
    const files = await gfs.find({ filename: { $in: filenames } }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ err: "No file exists" });
    }

    await gfs.delete(files[0]._id);
    await gfs.delete(files[1]._id);
    res.status(200).json({ message: "Seller rejected successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const approveSeller = async (req, res) => {
  const { id } = req.params;
  console.log(id);
  try {
    const updatedSeller = await Seller.findByIdAndUpdate(
      id,
      { isAccepted: true },
      { new: true } // Returns the updated document
    );

    if (!updatedSeller) {
      return res.status(404).json({ message: "seller not found" });
    }

    res
      .status(200)
      .json({ message: "Seller approved successfully", Seller: updatedSeller });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error approving Seller", error: error.message });
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
      return res.status(404).json({ message: "Seller not found" });
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
      return res.status(404).json({ message: "Seller not found" });
    }
    res.status(200).json(seller);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const seller = await Seller.findById(res.locals.user_id);
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }
    const { oldPassword, newPassword } = req.body;
    const isMatch = await seller.comparePassword(oldPassword, seller.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect old password" });
    }

    if (oldPassword === newPassword) {
      return res
        .status(400)
        .json({ message: "Old password and new password cannot be the same" });
    }
    seller.password = newPassword;
    await seller.save();
    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    if (error.name === "ValidationError") {
      // Gather all validation error messages
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return res
        .status(400)
        .json({ message: "Validation error", errors: validationErrors });
    }
    res.status(400).json({ error: error.message });
  }
};

const emailExists = async (email) => {
  if (await Tourist.findOne({ email })) {
    return true;
  } else if (await TourGuide.findOne({ email })) {
    return true;
  } else if (await Advertiser.findOne({ email })) {
    return true;
  } else if (await Seller.findOne({ email })) {
    return true;
  } else {
    console.log("email does not exist");
    return false;
  }
};

const usernameExists = async (username) => {
  if (
    (await Tourist.findOne({ username })) ||
    (await TourGuide.findOne({ username })) ||
    (await Advertiser.findOne({ username })) ||
    (await Seller.findOne({ username })) ||
    (await Admin.findOne({ username })) ||
    (await TourismGovernor.findOne({ username }))
  ) {
    console.log("username exists");
    return true;
  } else {
    console.log("username does not exist");
    return false;
  }
};

const getSalesReport = async (req, res) => {
  try {
    const { product, day, month, year } = req.query;
    let query = {};
    if (product) {
      query.product = product;
    }
    if (month && year) {
      query.month = month;
      query.year = year;
      if (day) {
        query.day = day;
      }
    }
    const productSales = await ProductSales.find(query).populate("product");
    const sellerProductsSales = productSales
      .filter(
        (sale) =>
          sale.product.seller === res.locals.user_id &&
          sale.product.isDeleted === false
      )
      .map((sale) => {
        return { ...sale, revenueAfterCommission: sale.revenue * 0.9 };
      });
    const totalSellerSalesRevenue = sellerProductsSales.reduce(
      (total, sale) => total + sale.revenue,
      0
    );
    const totalRevenueAfterCommission = totalSellerSalesRevenue * 0.9;

    res.status(200).json({
      sellerProductsSales,
      totalSellerSalesRevenue,
      totalRevenueAfterCommission,
    });
  } catch (error) {
    res.status(500).json({ message: error.message }); // Handle errors
  }
};

const getSellerNotifications = async (req, res) => {
  try {
    // Get seller ID from res.locals
    const sellerId = res.locals.user_id;

    if (!sellerId) {
      return res.status(400).json({ message: "Seller ID is required" });
    }

    // Find the seller and get their notifications
    const seller = await Seller.findById(sellerId, "notifications");

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    // Sort notifications in descending order based on the 'date' field
    const sortedNotifications = seller.notifications.sort((a, b) => b.date - a.date);

    // Return the sorted notifications
    return res.status(200).json({ notifications: sortedNotifications });
  } catch (error) {
    console.error("Error fetching notifications:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const markNotificationsAsSeen = async (req, res) => {
  try {
    // Find the seller by their ID and update the notifications in one operation
    const result = await Seller.updateOne(
      { _id: res.locals.user_id }, // Find seller by user ID
      {
        $set: {
          'notifications.$[elem].seen': true, // Set 'seen' to true for all unseen notifications
        }
      },
      {
        arrayFilters: [{ 'elem.seen': false }], // Only update notifications where seen is false
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'No unseen notifications found' });
    }

    res.json({ message: 'All notifications marked as seen' });
  } catch (error) {
    console.error("Error marking notifications as seen:", error.message);
    res.status(500).json({ message: 'Error marking notifications as seen' });
  }
};

const hasUnseenNotifications = async (req, res) => {
  try {
    // Find the seller by their ID
    const seller = await Seller.findById(res.locals.user_id);

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Check if there are any unseen notifications
    const hasUnseen = seller.notifications.some(notification => !notification.seen);

    res.json({ hasUnseen });
  } catch (error) {
    console.error("Error checking unseen notifications:", error.message);
    res.status(500).json({ message: 'Error checking unseen notifications' });
  }
};


module.exports = {
  deleteSellerAccount,
  deleteSeller,
  getAllSellers,
  getSellerByID,
  updateSeller,
  getSeller,
  changePassword,
  getUnacceptedSeller,
  approveSeller,
  rejectSeller,
  getSalesReport,
  getSellerNotifications,
  markNotificationsAsSeen,
  hasUnseenNotifications
};
