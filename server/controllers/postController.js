import Post from '../models/Post.js';

// Default initial posts for auto-seeding
const DEFAULT_INITIAL_POSTS = [
  {
    id: 'post-1',
    title: 'Một danh tính cho toàn bộ hành trình số',
    slug: 'mot-danh-tinh-cho-toan-bo-hanh-trinh-so',
    category: 'Công nghệ',
    subCategory: 'Kiến trúc Dữ liệu & e-ID',
    tag: 'TIN TỨC',
    summary: 'Khách hàng không nên phải chứng minh mình là ai ở mỗi điểm chạm với doanh nghiệp. Khi định danh điện tử (e-ID) được kết nối đúng, một lần xác thực duy nhất có thể mở ra toàn bộ hành trình trải nghiệm dịch vụ — đồng thời thiết lập tiêu chuẩn mới, khắt khe hơn về bảo mật Zero-Trust và quản trị dữ liệu xuyên suốt.',
    content: [
      {
        heading: 'Thách thức phân mảnh danh tính trong kỷ nguyên số',
        text: 'Trong kỷ nguyên siêu ứng dụng và dịch vụ số đa kênh (Omnichannel), phần lớn các doanh nghiệp quy mô vừa và lớn vẫn đang vận hành các kho dữ liệu (data silos) danh tính hoàn toàn tách biệt. Một người dùng khi tương tác qua Cổng thông tin trực tuyến, Ứng dụng di động, Hệ thống CRM, hay tại Quầy giao dịch vật lý thường phải trải qua các bước cung cấp giấy tờ và xác thực lặp đi lặp lại.\n\nSự phân mảnh này không chỉ tạo ra "điểm nghẽn ma sát" (friction point) nghiêm trọng khiến tỷ lệ từ bỏ dịch vụ (churn rate) tăng cao, mà còn tạo ra những lỗ hổng khổng lồ cho các cuộc tấn công chiếm đoạt tài khoản (ATO) và gian lận kỹ thuật số tinh vi.',
        quote: 'Từ ngày 28/09/2026, Nghị định mới về Định danh điện tử chính thức chuẩn hóa giao tiếp liên thông dữ liệu định danh cấp quốc gia, mở ra bước đột phá cho các doanh nghiệp số.',
        quoteAuthor: 'Ban Pháp chế & Cố vấn An ninh mạng DUDI Software'
      },
      {
        heading: 'Kiến trúc e-ID hợp nhất: Cầu nối trải nghiệm liền mạch',
        text: 'Giải pháp Định danh Số Hợp nhất của DUDI Software được thiết kế dựa trên nguyên lý Zero-Trust: "Never Trust, Always Verify". Hệ thống cung cấp cơ chế Single Sign-On (SSO) thế hệ mới, hỗ trợ xác thực sinh trắc học FIDO2/WebAuthn và phân quyền ngữ cảnh theo thời gian thực (Continuous Adaptive Trust).\n\nNhờ đó, thời gian onboarding người dùng mới được rút ngắn từ 15 phút xuống dưới 45 giây, trong khi tỷ lệ phát hiện gian lận tự động đạt trên 99.8% mà không làm gián đoạn trải nghiệm của người dùng hợp lệ.'
      },
      {
        heading: 'Lộ trình triển khai 4 bước chuẩn hóa cho doanh nghiệp',
        text: '1. Khảo sát và phân loại dữ liệu định danh hiện hành trên toàn bộ các touchpoints.\n2. Thiết lập Identity Fabric Layer làm tầng trừu tượng kết nối các hệ thống core legacy với cloud hiện đại.\n3. Triển khai eKYC & Passkey không mật khẩu để tối ưu chuyển đổi.\n4. Kích hoạt giám sát hành vi theo thời gian thực với AI Anomaly Detection.'
      }
    ],
    blocks: [
      { id: 'b-1', type: 'heading', text: 'Thách thức phân mảnh danh tính trong kỷ nguyên số' },
      { id: 'b-2', type: 'paragraph', text: 'Trong kỷ nguyên siêu ứng dụng và dịch vụ số đa kênh (Omnichannel), phần lớn các doanh nghiệp quy mô vừa và lớn vẫn đang vận hành các kho dữ liệu (data silos) danh tính hoàn toàn tách biệt.' },
      { id: 'b-3', type: 'image', url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80', caption: 'Kiến trúc máy chủ đám mây định danh bảo mật cao cấp DUDI Enterprise' },
      { id: 'b-4', type: 'quote', text: 'Từ ngày 28/09/2026, Nghị định mới về Định danh điện tử chính thức chuẩn hóa giao tiếp liên thông dữ liệu định danh cấp quốc gia.', author: 'Ban Pháp chế & An ninh mạng DUDI Software' },
      { id: 'b-5', type: 'heading', text: 'Kiến trúc e-ID hợp nhất: Cầu nối trải nghiệm liền mạch' },
      { id: 'b-6', type: 'paragraph', text: 'Giải pháp Định danh Số Hợp nhất của DUDI Software được thiết kế dựa trên nguyên lý Zero-Trust: "Never Trust, Always Verify".' },
      { id: 'b-7', type: 'heading', text: 'Lộ trình triển khai 4 bước chuẩn hóa cho doanh nghiệp' },
      { id: 'b-8', type: 'paragraph', text: '1. Khảo sát dữ liệu.\n2. Thiết lập Identity Fabric Layer.\n3. Triển khai eKYC & Passkey.\n4. Kích hoạt giám sát với AI Anomaly Detection.' }
    ],
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuADIr4Q-eXBux2oGG0S3oLGw0MRlSwe_vyYYBA-WcYPGS43DrauTr6azh1lVuP5oqNaMhPW4LjC-G27yaFUa-S21i1jq1x-B-TiiBYt4Tv9GmPILL7tQcP9xiA6jv6UhkM_GBHX44OsDlQ9ZLQHnAbk2ujUQ7SuOj0DjksUJDGgvZUA2ilzDPHDFLMNMbbd3MWX7PsucSzfLurlAJVssmGD4SoIdFd-uQn2Q3DqRE_0iPNK6GUwWRqv9oSlQP8_rpU2pvk',
    author: {
      name: 'Alex Vũ',
      role: 'Chuyên gia Kiến trúc Số',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBqw-vduZVOWhbLaDn1DaU18qakFhiVY0XwArz4Szdi66WNXtlVf0MwMXr_t5ymSlCfZPL6F77-B4U63hFCIow2ZJ7J3pYtzELJ07_ssO-Xek7q1cJevJ_geMQt_Iu5yMz5BoMjitCGWEYWAVn3Cj0b_GJsxeYUUGXS7krpQhKJh_NTXhtL6bNtlhtjU_yMoEQn5o-pn0Fn8djGAw9EOJYMJXMu-pfz6WeCc-iNuKXmqOcCB8eQRjHTcA'
    },
    date: '07 tháng 09, 2026',
    readTime: '6 phút đọc',
    views: 10034,
    tags: ['#DinhDanhSo', '#ZeroTrust', '#Fintech', '#ChuyenDoiSo', '#DUDISoftware'],
    status: 'published'
  },
  {
    id: 'post-2',
    title: 'Còn 2 Ngày Để Đăng Ký AI Awards 2026',
    slug: 'con-2-ngay-de-dang-ky-ai-awards-2026',
    category: 'AI & Big Data',
    subCategory: 'Sự kiện & Giải thưởng',
    tag: 'SỰ KIỆN',
    summary: 'Giải thưởng Công nghệ Trí tuệ Nhân tạo Việt Nam 2026 chuẩn bị đóng cổng đăng ký hồ sơ dự thi. Cơ hội vàng để các doanh nghiệp công nghệ khẳng định vị thế và kiến tạo giải pháp tương lai.',
    content: [
      {
        heading: 'Sân chơi quy mô nhất khu vực cho các giải pháp AI ứng dụng',
        text: 'AI Awards 2026 quy tụ hơn 300 hồ sơ sáng kiến từ các doanh nghiệp công nghệ hàng đầu và các startup kỳ lân trong khu vực Đông Nam Á. Hội đồng giám khảo bao gồm các chuyên gia hàng đầu từ MIT, Stanford và các viện nghiên cứu công nghệ quốc gia.'
      },
      {
        heading: 'Hạng mục giải thưởng trọng tâm',
        text: 'Năm nay giải thưởng vinh danh 5 nhóm lĩnh vực then chốt: AI trong Y tế & Chăm sóc sức khỏe, AI trong Tài chính - Ngân hàng, Trợ lý ảo Generative AI đa ngôn ngữ, Thị giác máy tính công nghiệp và AI Xanh - Tối ưu hóa năng lượng trung tâm dữ liệu.'
      }
    ],
    blocks: [
      { id: 'b-201', type: 'heading', text: 'Sân chơi quy mô nhất khu vực cho các giải pháp AI ứng dụng' },
      { id: 'b-202', type: 'paragraph', text: 'AI Awards 2026 quy tụ hơn 300 hồ sơ sáng kiến từ các doanh nghiệp công nghệ hàng đầu.' },
      { id: 'b-203', type: 'heading', text: 'Hạng mục giải thưởng trọng tâm' },
      { id: 'b-204', type: 'paragraph', text: 'Năm nay giải thưởng vinh danh 5 nhóm lĩnh vực then chốt trong chuyển đổi số toàn diện.' }
    ],
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDMwBCrY13MsqaCb1PwgNEiB5Jg73P2ZY0hpxkJoHoMEXeuZXeBIaND2prqfb9iFlMg-feksMvJLooPfLPhebtq0WrNlr2OTsSHzE1cnzTOMcC79MlTiuotPV0uIyQ6n5CsnYmrAqSzPLLVxx_4_Ph8xTQU3GzLWF7X_xAy0HwrLjzCVugBYHonuxTDcfxaRuUKACquln9bFbuj8KnZbxMlZtF7d0U2uWUMOIghzYuN02M7x41AOrR_og',
    author: {
      name: 'Minh Trang',
      role: 'Biên tập viên Công nghệ',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
    },
    date: '06 tháng 09, 2026',
    readTime: '4 phút đọc',
    views: 9230,
    tags: ['#AIAwards2026', '#TriTueNhanTao', '#CongNgheSo', '#Innovation'],
    status: 'published'
  },
  {
    id: 'post-3',
    title: 'Việt Nam Công Bố 9 Trụ Cột Chiến Lược Số Quốc Gia',
    slug: 'viet-nam-cong-bo-9-tru-cot-chien-luoc-so-quoc-gia',
    category: 'Chính sách & Số hóa',
    subCategory: 'Chiến lược Quốc gia',
    tag: 'CHIẾN LƯỢC',
    summary: 'Chiến lược phát triển kinh tế số và xã hội số đến năm 2030 đặt mục tiêu kinh tế số chiếm 30% GDP, tạo động lực bứt phá mạnh mẽ cho toàn bộ hệ sinh thái công nghệ trong nước.',
    content: [
      {
        heading: 'Định hình tương lai số với hạ tầng tự chủ và kết nối mở',
        text: '9 trụ cột chiến lược bao gồm: Thể chế số linh hoạt, Hạ tầng số băng rộng và Data Center đạt chuẩn Tier 3+, Nền tảng số quốc gia, Dữ liệu số dùng chung, An toàn thông tin mạng Zero-Trust, Nhân lực số chất lượng cao, Doanh nghiệp công nghệ số tiên phong, Đổi mới sáng tạo và Hợp tác quốc tế sâu rộng.'
      }
    ],
    blocks: [
      { id: 'b-301', type: 'heading', text: 'Định hình tương lai số với hạ tầng tự chủ và kết nối mở' },
      { id: 'b-302', type: 'paragraph', text: '9 trụ cột chiến lược bao gồm: Thể chế số linh hoạt, Hạ tầng số băng rộng và Data Center đạt chuẩn Tier 3+.' }
    ],
    coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    author: {
      name: 'Hoàng Nam',
      role: 'Chuyên gia Phân tích Chính sách',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
    },
    date: '05 tháng 09, 2026',
    readTime: '8 phút đọc',
    views: 12450,
    tags: ['#KinhTeSo', '#ChienLuocQuocGia', '#DataCenter', '#DUDISoftware'],
    status: 'published'
  }
];

// GET /api/posts - Get all posts with optional search, category, status filters
export const getPosts = async (req, res) => {
  try {
    const { category, status, search } = req.query;
    const query = {};

    if (category && category !== 'Tất cả') {
      query.category = category;
    }
    if (status && status !== 'all') {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } },
        { 'author.name': { $regex: search, $options: 'i' } }
      ];
    }

    let posts = await Post.find(query).sort({ createdAt: -1 });

    // Auto-seed if database is empty on first call
    if (posts.length === 0 && Object.keys(query).length === 0) {
      console.log('[MongoDB] Khởi tạo dữ liệu mẫu ban đầu vào database...');
      await Post.insertMany(DEFAULT_INITIAL_POSTS);
      posts = await Post.find().sort({ createdAt: -1 });
    }

    res.json({ success: true, count: posts.length, data: posts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/posts/:idOrSlug - Get single post by id or slug
export const getPostByIdOrSlug = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const post = await Post.findOne({
      $or: [{ id: idOrSlug }, { slug: idOrSlug }]
    });

    if (!post) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    }

    res.json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/posts - Create a new post
export const createPost = async (req, res) => {
  try {
    const postData = req.body;
    if (!postData.title) {
      return res.status(400).json({ success: false, message: 'Tiêu đề bài viết không được để trống' });
    }

    if (!postData.id) {
      postData.id = `post-${Date.now()}`;
    }

    const saved = await Post.findOneAndUpdate(
      { id: postData.id },
      { $set: postData },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true, runValidators: false }
    );
    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    console.error('[Create Post Error]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/posts/:id - Update an existing post
export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const isMongoId = id && /^[0-9a-fA-F]{24}$/.test(id);
    const query = isMongoId ? { $or: [{ id: id }, { _id: id }] } : { id: id };

    const updated = await Post.findOneAndUpdate(
      query,
      { $set: updateData },
      { returnDocument: 'after', upsert: true, runValidators: false }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết để cập nhật' });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('[Update Post Error]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/posts/:id/toggle-status - Toggle published / draft
export const togglePostStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findOne({
      $or: [{ id: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
    });

    if (!post) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    }

    post.status = post.status === 'published' ? 'draft' : 'published';
    await post.save();

    res.json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/posts/:id - Delete a post
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Post.findOneAndDelete({
      $or: [{ id: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết để xóa' });
    }

    res.json({ success: true, message: 'Đã xóa bài viết thành công', id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/posts/seed - Reset and seed defaults
export const seedDefaultPosts = async (req, res) => {
  try {
    await Post.deleteMany({});
    const inserted = await Post.insertMany(DEFAULT_INITIAL_POSTS);
    res.json({ success: true, message: 'Đã nạp lại bài viết mẫu mặc định thành công', count: inserted.length, data: inserted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
