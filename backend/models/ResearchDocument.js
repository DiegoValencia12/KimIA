import mongoose from "mongoose";

const factSchema = new mongoose.Schema(
  {
    assertion: {
      type: String,
      required: true,
      trim: true,
      maxlength: 600,
    },
    evidence: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1200,
    },
    type: {
      type: String,
      enum: [
        "data",
        "requirement",
        "procedure",
        "definition",
        "authority",
        "other",
      ],
      required: true,
    },
  },
  { _id: false },
);

const dateSchema = new mongoose.Schema(
  {
    event: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    date: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    evidence: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1200,
    },
  },
  { _id: false },
);

const quantitySchema = new mongoose.Schema(
  {
    concept: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    value: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    evidence: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1200,
    },
  },
  { _id: false },
);

const entitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 250,
    },
    type: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    evidence: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1200,
    },
  },
  { _id: false },
);

const normalizedDataSchema = new mongoose.Schema(
  {
    facts: {
      type: [factSchema],
      default: [],
    },
    dates: {
      type: [dateSchema],
      default: [],
    },
    quantities: {
      type: [quantitySchema],
      default: [],
    },
    entities: {
      type: [entitySchema],
      default: [],
    },
  },
  { _id: false },
);

const normalizationSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["pending", "completed", "partial", "failed"],
      default: "pending",
    },
    chunkCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    processedChunks: {
      type: Number,
      default: 0,
      min: 0,
    },
    failedChunks: {
      type: Number,
      default: 0,
      min: 0,
    },
    originalLength: {
      type: Number,
      default: 0,
      min: 0,
    },
    analyzedLength: {
      type: Number,
      default: 0,
      min: 0,
    },
    truncatedForNormalization: {
      type: Boolean,
      default: false,
    },
    normalizedAt: {
      type: Date,
      default: null,
    },
    error: {
      type: String,
      default: "",
      maxlength: 500,
    },
  },
  { _id: false },
);

const researchDocumentSchema = new mongoose.Schema(
  {
    researchId: {
      type: String,
      required: true,
      index: true,
      immutable: true,
    },

    userId: {
      type: String,
      required: true,
      index: true,
      immutable: true,
    },

    title: {
      type: String,
      default: "",
      trim: true,
    },

    url: {
      type: String,
      required: true,
      trim: true,
    },

    finalUrl: {
      type: String,
      default: "",
      trim: true,
    },

    source: {
      type: String,
      default: "",
      trim: true,
    },

    content: {
      type: String,
      required: true,
    },

    contentType: {
      type: String,
      default: "text/html",
    },

    status: {
      type: String,
      enum: ["collected", "processed", "failed"],
      default: "collected",
      index: true,
    },

    normalizedData: {
      type: normalizedDataSchema,
      default: () => ({}),
    },

    normalization: {
      type: normalizationSchema,
      default: () => ({}),
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: "research_documents",
  },
);

researchDocumentSchema.index({ researchId: 1, url: 1 }, { unique: true });
researchDocumentSchema.index({ userId: 1, researchId: 1 });

const ResearchDocument =
  mongoose.models.ResearchDocument ||
  mongoose.model("ResearchDocument", researchDocumentSchema);

export default ResearchDocument;
