import mongoose from "mongoose";

export const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    throw new Error("La variable MONGODB_URI no está configurada");
  }

  await mongoose.connect(mongoURI);
  console.log("MongoDB conectado correctamente");
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
  console.log("MongoDB desconectado correctamente");
};
