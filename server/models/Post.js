import mongoose from 'mongoose';

const BlockSchema = new mongoose.Schema({
  id: { type: String },
  type: { type: String, default: 'paragraph' },
  text: { type: String, default: '' },
  url: { type: String, default: '' },
  caption: { type: String, default: '' },
  code: { type: String, default: '' },
  language: { type: String, default: 'javascript' },
  author: { type: String, default: '' },
  align: { type: String, default: 'left' },
  color: { type: String, default: '' },
  bgColor: { type: String, default: '' },
  headers: { type: [String], default: [] },
  rows: { type: [[String]], default: [] },
  tableRows: { type: [[String]], default: [] },
  items: { type: [String], default: [] },
  listItems: { type: [String], default: [] },
  listType: { type: String, default: 'bullet' },
  level: { type: Number, default: 2 }
}, { _id: false, strict: false });

const ContentSectionSchema = new mongoose.Schema({
  heading: { type: String, default: '' },
  text: { type: String, default: '' },
  quote: { type: String, default: '' },
  quoteAuthor: { type: String, default: '' }
}, { _id: false });

const AuthorSchema = new mongoose.Schema({
  name: { type: String, default: 'Alex Vũ' },
  role: { type: String, default: 'Chuyên gia Kiến trúc Số' },
  avatar: { type: String, default: '' }
}, { _id: false });

const PostSchema = new mongoose.Schema({
  id: { type: String, unique: true, sparse: true },
  title: { type: String, required: true, trim: true },
  slug: { type: String, trim: true },
  category: { type: String, default: 'Công nghệ' },
  subCategory: { type: String, default: 'Kiến trúc Dữ liệu & e-ID' },
  tag: { type: String, default: 'TIN TỨC' },
  summary: { type: String, default: '' },
  sapo: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  content: { type: [ContentSectionSchema], default: [] },
  blocks: { type: [BlockSchema], default: [] },
  author: { type: AuthorSchema, default: () => ({}) },
  date: { type: String, default: () => new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) },
  readTime: { type: String, default: '5 phút đọc' },
  views: { type: Number, default: 0 },
  tags: { type: [String], default: [] },
  status: { type: String, enum: ['published', 'draft'], default: 'published' }
}, {
  timestamps: true
});

// Auto set custom id if not provided before saving
PostSchema.pre('save', function() {
  if (!this.id) {
    this.id = `post-${Date.now()}`;
  }
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
  }
});

const Post = mongoose.model('Post', PostSchema);
export default Post;
