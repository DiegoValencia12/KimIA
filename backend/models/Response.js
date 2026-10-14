import mongoose from 'mongoose'

const responseSchema = new mongoose.Schema(
  {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      required: true,
      index: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    model: {
      type: String,
      default: 'qwen3:0.6b'
    }
  },
  {
    timestamps: true
  }
)

const Response = mongoose.model('Response', responseSchema)

export default Response