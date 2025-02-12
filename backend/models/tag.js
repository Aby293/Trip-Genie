const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const tagSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

const Tag = mongoose.model("Tag", tagSchema);
module.exports = Tag;
