import mongoose from "mongoose";

const researchSchema = new mongoose.Schema(
  {
    researchId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      immutable: true,
    },

    userId: {
      type: String,
      required: true,
      index: true,
      immutable: true,
    },

    query: {
      type: String,
      required: true,
      trim: true,
    },

    title: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "researching",
        "collected",
        "normalizing",
        "completed",
        "failed",
      ],
      default: "pending",
      index: true,
    },

    documentCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    agentNotes: {
      type: String,
      default: "",
    },

    result: {
      type: String,
      default: "",
    },

    error: {
      type: String,
      default: "",
    },

    startedAt: {
      type: Date,
      default: Date.now,
    },

    collectedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "researches",
  },
);

researchSchema.index({ userId: 1, createdAt: -1 });

const Research =
  mongoose.models.Research || mongoose.model("Research", researchSchema);

export default Research;
