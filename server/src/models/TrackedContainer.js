const mongoose = require('mongoose');

const TrackedContainerSchema = new mongoose.Schema({
  containerNumber: { type: String, required: true, unique: true, index: true },
  enabled: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('TrackedContainer', TrackedContainerSchema);
