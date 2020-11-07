import mongoose from 'mongoose';

const gameSubTypesSchema = new mongoose.Schema({
  lucky: Boolean,
  double: Boolean,
});

export default gameSubTypesSchema;
