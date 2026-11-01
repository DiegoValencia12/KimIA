
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
      required: true,
      index: true,
      immutable: true
    },

    summary: {
      type: String,
      default: ''
    },

    summarizedMessageCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
)

const Chat = mongoose.model('Chat', chatSchema)

export default Chat
