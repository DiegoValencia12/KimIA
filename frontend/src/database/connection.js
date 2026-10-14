
import mongoose from 'mongoose';
import 'dotenv/config';

const connection = async () =>
{
  try
  {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('Conexión a MongoDB exitosa');
  }
  catch (error)
  {
    console.error('Error al conectar a MongoDB:', error.message);
    process.exit(1);
  }
};

export default connection;
