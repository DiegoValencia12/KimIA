import mongoose from 'mongoose'

const chatSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: 'Nuevo chat',
      trim: true
    },
    userId: {
      type: String,
      default: 'local-user',
      index: true
    }
  },
  {
    timestamps: true
  }
)

const Chat = mongoose.model('Chat', chatSchema)

export default Chat