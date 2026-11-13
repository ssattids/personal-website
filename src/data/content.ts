export type Entry = {
  title: string
  subtitle?: string
  image?: string
  tags?: string[]
  points: string[]
}

export const profile = {
  name: "Salar Satti",
  role: "Data Scientist",
  tagline: "Trying to solve the world's problems using data",
}

export const experience: Entry[] = [
  {
    title: "Schneider Electric",
    image:
      "https://media.baumpub.com/files/slides/locale_image/full/0157/39029_en_1f624_41610_schneider-electriclogo.jpg",
    tags: ["Spark", "Azure Databricks", "React", "Django", "NLP"],
    points: [
      "Worked with terabyte-scale data from cloud-connected IoT devices; selected Spark and Parquet files to analyze data after running benchmarks",
      "Set up data pipelines and managed several tables for our team and other teams using Spark and Azure Databricks",
      "Worked on time series models for event prediction",
      "Created a dashboard using React and Django to give views into data",
      "Created an NER (named entity recognition) model that classified customer reviews on our products into business-defined categories, outperforming the previous approach",
    ],
  },
  {
    title: "Olympus",
    image: "https://mma.prnewswire.com/media/389973/Olympus_Logo.jpg?p=publish",
    tags: ["Machine Learning", "Random Forests", "SVMs"],
    points: [
      "Worked with the Chief Product Scientist to implement various machine learning algorithms for X-ray scanners",
      "Implemented decision trees, linear regression, SVMs, and created a random forest ensemble method which improved accuracy",
      "Preprocessed data in various formats, intelligently handled missing values, and simulated data",
      "Conducted model evaluation, explained algorithms, created visualizations, and helped management understand data issues",
    ],
  },
]

export const projects: Entry[] = [
  {
    title: "Neural Networks and Vision",
    image:
      "https://raw.githubusercontent.com/clankster99/NN_project/master/SemanticSegmentation.png",
    tags: ["CNNs", "Semantic Segmentation", "Transfer Learning"],
    points: [
      "Implemented a Fully Convolutional Network for semantic segmentation with transfer learning, using Google satellite imagery to estimate traffic levels by detecting roads and cars",
      "Applications include finding faster routes through traffic and helping authorities manage traffic and plan infrastructure spending",
    ],
  },
  {
    title: "Neural Machine Translation",
    image: "https://opennmt.net/simple-attn.png",
    tags: ["Seq2Seq", "Attention"],
    // TODO: replace with a real project description
    points: ["Sequence-to-sequence translation model with attention."],
  },
]

export const education: Entry[] = [
  {
    title: "UMass Amherst",
    subtitle: "Master of Science in Computer Science",
    points: [],
  },
]

export type Post = { title: string; date: string; summary: string }

export const posts: Post[] = []
