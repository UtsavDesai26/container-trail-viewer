const mongoose = require('mongoose');

const ContainerPointSchema = new mongoose.Schema({
  containerNumber: { type: String, required: true, index: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  timestamp: { type: Date, required: true },
  timeInMs: { type: Number, required: true },
  eventName: { type: String },
  type: { type: String, enum: ['original', 'interpolated'], default: 'interpolated' },
  raw: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

module.exports = mongoose.model('ContainerPoint', ContainerPointSchema);
