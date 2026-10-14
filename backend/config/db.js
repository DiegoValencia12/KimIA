
import mongoose from 'mongoose';

const connectDB = async () =>
{
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI)
  {
    throw new Error('La variable MONGODB_URI no está configurada');
  }

  await mongoose.connect(mongoURI);

  console.log('MongoDB conectado correctamente');
};

export default connectDB;
