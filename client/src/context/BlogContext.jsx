import React, { createContext, useContext, useState, useEffect } from 'react';

const BlogContext = createContext();

const INITIAL_POSTS = [
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
    title: 'Việt Nam Công Bố 9 Trụ Cột Chiến Lược Số',
    slug: 'viet-nam-cong-bo-9-tru-cot-chien-luoc-so',
    category: 'Chính sách & Số hóa',
    subCategory: 'Chiến lược Quốc gia',
    tag: 'CHIẾN LƯỢC',
    summary: 'Khung kiến trúc chiến lược chuyển đổi số quốc gia giai đoạn mới xác định 9 trụ cột cốt lõi tập trung vào hạ tầng bán dẫn, đám mây có chủ quyền và bảo mật dữ liệu công dân.',
    content: [
      {
        heading: 'Bản đồ đường hướng thúc đẩy kinh tế số đạt 35% GDP',
        text: 'Chiến lược mới nhấn mạnh sự kết nối chặt chẽ giữa khu vực công và các tập đoàn phần mềm tư nhân trong việc phát triển hệ sinh thái mở, API dùng chung và trung tâm dữ liệu xanh tiêu chuẩn Tier IV.'
      }
    ],
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDSRltqJuCjEknYEdWOdpNCJl63D8R0ZaXDyQ-LtAwUdc58EhWqJVYh7zlHkjNUYwBk4gmlz4SA24lyPQHBD3av1ZwHnR7oq_08wcA-Zw5QJ1gkLwiyO2ibsJRVywskfbT0WlclXeQYITj2TlW-XFEW162oktaYgRk3X2JCkTnf2yr-FTP81LDDaG-DjhOgONpKfvcFe6mbjBnIMcTmdmzMXuKGiSfqKvS29WiOOaiGzimM7e5ydP3ypQ',
    author: {
      name: 'TS. Hoàng Nam',
      role: 'Cố vấn Chính sách Chuyển đổi số',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
    },
    date: '05 tháng 09, 2026',
    readTime: '8 phút đọc',
    views: 8230,
    tags: ['#KinhTeSo', '#ChienLuocQuocGia', '#HaTangCloud', '#DUDISoftware'],
    status: 'published'
  },
  {
    id: 'post-4',
    title: 'Không đầu tư an ninh mạng sớm, doanh nghiệp sẽ phải trả giá đắt',
    slug: 'khong-dau-tu-an-ninh-mang-som-doanh-nghiep-se-phai-tra-gia-dat',
    category: 'Bảo mật',
    subCategory: 'Cyber Security & DevSecOps',
    tag: 'BẢO MẬT',
    summary: 'Chi phí khắc phục một cuộc tấn công mã độc tống tiền (Ransomware) năm 2026 cao gấp 24 lần so với ngân sách duy trì hạ tầng phòng thủ chủ động.',
    content: [
      {
        heading: 'Mô hình phòng vệ chủ động với AI Threat Hunting',
        text: 'Các cuộc tấn công mạng hiện đại diễn ra tự động với tốc độ tính bằng mili-giây. Để ứng phó, doanh nghiệp cần trang bị giải pháp SOC tích hợp AI nhằm phát hiện và vô hiệu hóa các hành vi bất thường ngay từ giai đoạn thăm dò.'
      }
    ],
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCkLdz-vR_iyAX0j4iVCcPnjQsOzAX_KczEe7HfoFpvwDT9QpEMbSUF2Hh647paVmXGaDb00iTEERKPe1YNKLpHwy-G3StpAg-sgivoxKG1uqEzjoFg1_BZ50BKTYvgSUDB7_6aFestVOe1nIFIQsc2zJwSn3CbLGPtqxjO0J65H_MPdi_NJuC4PcD__j2KvQljJq9ySJmPqEvETlS5I2tdMVnU1ZWdjzz94frIlYDMNCmqk0zRajotYg',
    author: {
      name: 'Vũ Quốc Huy',
      role: 'Kỹ sư Trưởng An toàn Thông tin',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'
    },
    date: '04 tháng 09, 2026',
    readTime: '5 phút đọc',
    views: 6830,
    tags: ['#AnNinhMang', '#CyberSecurity', '#DevSecOps', '#ZeroTrust'],
    status: 'published'
  },
  {
    id: 'post-5',
    title: 'Tối ưu hóa kiến trúc Microservices cho Fintech & Ngân hàng số',
    slug: 'toi-uu-hoa-kien-truc-microservices-cho-fintech',
    category: 'Công nghệ',
    subCategory: 'Software Architecture',
    tag: 'KIẾN TRÚC',
    summary: 'Chia sẻ kinh nghiệm xử lý 50,000 giao dịch/giây (TPS) với độ trễ P99 dưới 15ms sử dụng kiến trúc Event-Driven, gRPC và Kubernetes Service Mesh.',
    content: [
      {
        heading: 'Từ Monolith phân tán sang Event-Driven đích thực',
        text: 'Việc tách dịch vụ quá sớm hoặc chia theo mô hình sai lầm dễ dẫn đến Distributed Monolith. Bài viết phân tích cách sử dụng Apache Kafka, CDC (Change Data Capture) và Outbox Pattern để bảo đảm tính nhất quán dữ liệu ACID trong hệ thống phân tán.'
      }
    ],
    coverImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
    author: {
      name: 'Alex Vũ',
      role: 'Chuyên gia Kiến trúc Số',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBqw-vduZVOWhbLaDn1DaU18qakFhiVY0XwArz4Szdi66WNXtlVf0MwMXr_t5ymSlCfZPL6F77-B4U63hFCIow2ZJ7J3pYtzELJ07_ssO-Xek7q1cJevJ_geMQt_Iu5yMz5BoMjitCGWEYWAVn3Cj0b_GJsxeYUUGXS7krpQhKJh_NTXhtL6bNtlhtjU_yMoEQn5o-pn0Fn8djGAw9EOJYMJXMu-pfz6WeCc-iNuKXmqOcCB8eQRjHTcA'
    },
    date: '02 tháng 09, 2026',
    readTime: '9 phút đọc',
    views: 5960,
    tags: ['#Microservices', '#Fintech', '#HighConcurrency', '#EventDriven'],
    status: 'published'
  },
  {
    id: 'post-6',
    title: 'Những sai lầm khi thiết kế Landing Page khiến tỷ lệ chuyển đổi giảm',
    slug: 'nhung-sai-lam-khi-thiet-ke-landing-page',
    category: 'Thiết kế',
    subCategory: 'UI/UX & Conversion Rate',
    tag: 'THIẾT KẾ',
    summary: 'Tìm hiểu những lỗi giao diện và trải nghiệm thường gặp khiến khách hàng rời bỏ trang chỉ sau 3 giây đầu tiên.',
    content: [
      {
        heading: 'Quá nhiều CTA và thiếu thông điệp giá trị cốt lõi',
        text: 'Một Landing Page hiệu quả cần tuân thủ cấu trúc Storytelling mạch lạc: Vấn đề -> Giải pháp độc bản -> Bằng chứng xã hội -> Lời kêu gọi hành động rõ ràng.'
      }
    ],
    coverImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80',
    author: {
      name: 'Ngọc Lan',
      role: 'Lead Product Designer',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80'
    },
    date: '15 tháng 07, 2026',
    readTime: '4 phút đọc',
    views: 4320,
    tags: ['#UIUX', '#LandingPage', '#ConversionRate', '#DesignSystem'],
    status: 'published'
  }
];

const STORAGE_KEY = 'dudi_software_blog_posts_v1';

// Helper to extract slug or ID from browser URL
export const getSlugFromBrowserUrl = () => {
  if (typeof window === 'undefined') return null;
  const pathname = window.location.pathname;
  const hash = window.location.hash.replace(/^#\/?/, '');
  const searchParams = new URLSearchParams(window.location.search);
  const querySlug = searchParams.get('slug') || searchParams.get('id');

  if (querySlug) return querySlug;

  const blogMatch = pathname.match(/^\/blog\/(.+)/i);
  if (blogMatch && blogMatch[1]) {
    return decodeURIComponent(blogMatch[1]);
  }

  const hashBlogMatch = hash.match(/^blog\/(.+)/i);
  if (hashBlogMatch && hashBlogMatch[1]) {
    return decodeURIComponent(hashBlogMatch[1]);
  }

  return null;
};

export function BlogProvider({ children, onNavigate }) {
  const [posts, setPosts] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (err) {
      console.warn('Lỗi đọc dữ liệu blog từ localStorage:', err);
    }
    return INITIAL_POSTS;
  });

  const [activePostId, setActivePostId] = useState(() => {
    const urlSlug = getSlugFromBrowserUrl();
    if (urlSlug) {
      const matched = INITIAL_POSTS.find((p) => p.slug === urlSlug || p.id === urlSlug || p._id === urlSlug);
      if (matched && (matched.status || 'published') === 'published') return matched.id;
    }
    return 'post-1';
  });

  const [postStatusError, setPostStatusError] = useState(() => {
    const urlSlug = getSlugFromBrowserUrl();
    const isPreview = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview') === 'true';
    if (urlSlug) {
      const matched = INITIAL_POSTS.find((p) => p.slug === urlSlug || p.id === urlSlug || p._id === urlSlug);
      if (!matched) return { type: 'not_found', slug: urlSlug };
      if ((matched.status || 'published') !== 'published' && !isPreview) {
        return { type: 'draft', post: matched, slug: urlSlug };
      }
    }
    return null;
  });

  const [temporaryPreviewPost, setTemporaryPreviewPost] = useState(null);
  const [isPreviewMode, setIsPreviewMode] = useState(() => {
    return typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview') === 'true';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [isLoading, setIsLoading] = useState(true);
  const [isDatabaseConnected, setIsDatabaseConnected] = useState(false);

  // Evaluate active post and draft restriction from browser route
  const evaluateActivePostFromRoute = (postsList = posts) => {
    if (window.location.pathname.startsWith('/admin')) {
      setPostStatusError(null);
      return;
    }

    const urlSlug = getSlugFromBrowserUrl();
    const isPreview = (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview') === 'true') || Boolean(temporaryPreviewPost);
    const published = postsList.filter((p) => (p.status || 'published') === 'published');

    if (temporaryPreviewPost) {
      setPostStatusError(null);
      setActivePostId(temporaryPreviewPost.id);
      setIsPreviewMode(true);
      return;
    }

    if (urlSlug) {
      const matched = postsList.find(
        (p) => p.slug === urlSlug || p.id === urlSlug || p._id === urlSlug
      );

      if (!matched) {
        setPostStatusError({ type: 'not_found', slug: urlSlug });
        setActivePostId(null);
        setIsPreviewMode(false);
        return;
      }

      if ((matched.status || 'published') !== 'published') {
        if (isPreview) {
          // Allowed in PREVIEW mode
          setPostStatusError(null);
          setActivePostId(matched.id);
          setIsPreviewMode(true);
          return;
        }

        // DRAFT post -> block access via public URL
        setPostStatusError({ type: 'draft', post: matched, slug: urlSlug });
        setActivePostId(null);
        setIsPreviewMode(false);
        return;
      }

      // Valid published post
      setPostStatusError(null);
      setActivePostId(matched.id);
      setIsPreviewMode(isPreview);
    } else {
      setPostStatusError(null);
      setIsPreviewMode(false);
      if (!activePostId || !published.some((p) => p.id === activePostId)) {
        if (published.length > 0) {
          setActivePostId(published[0].id);
        }
      }
    }
  };

  // Clear preview post state and reset URL
  const clearPreviewPost = () => {
    setTemporaryPreviewPost(null);
    setIsPreviewMode(false);
    if (typeof window !== 'undefined' && window.location.search.includes('preview=true')) {
      const url = new URL(window.location.href);
      url.searchParams.delete('preview');
      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
    }
  };

  // Sync active post from URL on initial load and when posts list updates
  useEffect(() => {
    if (posts.length > 0) {
      evaluateActivePostFromRoute(posts);
    }
  }, [posts, temporaryPreviewPost]);

  // Handle browser Back / Forward history navigation
  useEffect(() => {
    const handleUrlChange = () => {
      evaluateActivePostFromRoute(posts);
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, [posts, temporaryPreviewPost]);

  // Fetch posts from MongoDB API
  const fetchPostsFromDB = async () => {
    try {
      const res = await fetch('/api/posts');
      if (res.ok) {
        const result = await res.json();
        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
          setPosts(result.data);
          setIsDatabaseConnected(true);
          evaluateActivePostFromRoute(result.data);
          return;
        }
      }
      // Check health endpoint if posts empty
      const healthRes = await fetch('/api/health');
      if (healthRes.ok) {
        setIsDatabaseConnected(true);
      } else {
        setIsDatabaseConnected(false);
      }
    } catch (err) {
      setIsDatabaseConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPostsFromDB();

    // Auto check MongoDB connection every 10 seconds
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          setIsDatabaseConnected((prev) => {
            if (!prev) fetchPostsFromDB();
            return true;
          });
        } else {
          setIsDatabaseConnected(false);
        }
      } catch {
        setIsDatabaseConnected(false);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Persist to localStorage whenever posts change as fallback cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    } catch (err) {
      console.warn('Lỗi lưu blog vào localStorage:', err);
    }
  }, [posts]);

  // Published posts list
  const publishedPosts = posts.filter((p) => (p.status || 'published') === 'published');

  // Current active post (Supports temporaryPreviewPost during admin live preview)
  const activePost = postStatusError
    ? null
    : (temporaryPreviewPost || posts.find((p) => p.id === activePostId) || publishedPosts.find((p) => p.id === activePostId) || publishedPosts[0] || posts[0] || null);

  // Dynamically update document title for SEO and user experience
  useEffect(() => {
    if (window.location.pathname.startsWith('/admin')) return;

    if (isPreviewMode) {
      document.title = `[Xem trước] ${activePost?.title || 'Bài viết'} | DUDI Software`;
    } else if (postStatusError?.type === 'draft') {
      document.title = 'Bài viết chưa xuất bản (Bản nháp) | DUDI Software';
    } else if (postStatusError?.type === 'not_found') {
      document.title = 'Không tìm thấy bài viết (404) | DUDI Software';
    } else if (activePost?.title) {
      document.title = `${activePost.title} | DUDI Software Blog`;
    }
  }, [activePost, postStatusError, isPreviewMode]);

  // Select a post by ID or Slug, updates URL and navigates (supports isPreview)
  const handleSelectPost = (idOrSlug, pushState = true, isPreview = false) => {
    const matched = posts.find((p) => p.id === idOrSlug || p.slug === idOrSlug || p._id === idOrSlug);
    const targetSlug = matched ? (matched.slug || matched.id) : idOrSlug;

    if (!matched) {
      setPostStatusError({ type: 'not_found', slug: idOrSlug });
      setActivePostId(null);
      setIsPreviewMode(false);
      if (pushState && targetSlug) {
        const newPath = `/blog/${targetSlug}`;
        if (window.location.pathname !== newPath) {
          window.history.pushState({ slug: targetSlug, view: 'blog' }, '', newPath);
        }
      }
      if (onNavigate) onNavigate('blog', targetSlug);
      return;
    }

    const isPublished = (matched.status || 'published') === 'published';

    if (!isPublished && !isPreview) {
      // Draft post -> block public access and show draft notice
      setPostStatusError({ type: 'draft', post: matched, slug: targetSlug });
      setActivePostId(null);
      setIsPreviewMode(false);
      if (pushState && targetSlug) {
        const newPath = `/blog/${targetSlug}`;
        if (window.location.pathname !== newPath) {
          window.history.pushState({ slug: targetSlug, view: 'blog' }, '', newPath);
        }
      }
      if (onNavigate) onNavigate('blog', targetSlug);
      return;
    }

    // Allowed (Published OR Preview)
    setPostStatusError(null);
    setActivePostId(matched.id);
    setIsPreviewMode(Boolean(isPreview || !isPublished));

    // Increment view count optimistically only for published posts viewed publicly
    if (isPublished && !isPreview) {
      setPosts((prev) =>
        prev.map((p) => (p.id === matched.id ? { ...p, views: (p.views || 0) + 1 } : p))
      );

      fetch(`/api/posts/${matched.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ views: (matched.views || 0) + 1 })
      }).catch(() => {});
    }

    if (pushState && targetSlug) {
      const newPath = isPreview ? `/blog/${targetSlug}?preview=true` : `/blog/${targetSlug}`;
      if (window.location.pathname !== newPath) {
        window.history.pushState({ slug: targetSlug, view: 'blog', preview: isPreview }, '', newPath);
      }
    }

    if (onNavigate) {
      onNavigate('blog', isPreview ? `${targetSlug}?preview=true` : targetSlug);
    }
  };

  // Add post to MongoDB & local state
  const createPost = async (newPostData) => {
    const generatedId = `post-${Date.now()}`;
    const newPost = {
      id: generatedId,
      slug: (newPostData.title || 'bai-viet-moi')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-'),
      title: newPostData.title,
      category: newPostData.category || 'Công nghệ',
      subCategory: newPostData.subCategory || 'Công nghệ & Đổi mới',
      tag: (newPostData.category || 'TIN TỨC').toUpperCase(),
      summary: newPostData.summary || '',
      content: newPostData.content && Array.isArray(newPostData.content) ? newPostData.content : [
        {
          heading: 'Nội dung chi tiết',
          text: newPostData.rawContent || newPostData.summary || 'Nội dung đang được cập nhật...'
        }
      ],
      blocks: newPostData.blocks || [],
      coverImage: newPostData.coverImage || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
      author: {
        name: newPostData.authorName || 'Alex Vũ',
        role: newPostData.authorRole || 'Quản trị viên DUDI',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBqw-vduZVOWhbLaDn1DaU18qakFhiVY0XwArz4Szdi66WNXtlVf0MwMXr_t5ymSlCfZPL6F77-B4U63hFCIow2ZJ7J3pYtzELJ07_ssO-Xek7q1cJevJ_geMQt_Iu5yMz5BoMjitCGWEYWAVn3Cj0b_GJsxeYUUGXS7krpQhKJh_NTXhtL6bNtlhtjU_yMoEQn5o-pn0Fn8djGAw9EOJYMJXMu-pfz6WeCc-iNuKXmqOcCB8eQRjHTcA'
      },
      date: new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date()),
      readTime: newPostData.readTime || '5 phút đọc',
      views: 1,
      tags: newPostData.tags || ['#DUDISoftware', '#Technology'],
      status: newPostData.status || 'published'
    };

    // Optimistic UI update
    setPosts((prev) => [newPost, ...prev]);

    // Send to MongoDB Backend
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost)
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setIsDatabaseConnected(true);
          return result.data;
        }
      }
    } catch (err) {
      console.warn('[MongoDB API] Lỗi lưu bài viết vào MongoDB, đã lưu bộ nhớ tạm:', err);
    }
    return newPost;
  };

  // Update post in MongoDB & local state
  const updatePost = async (id, updatedData) => {
    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updatedData } : p))
    );

    // Send update to MongoDB Backend
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (res.ok) {
        setIsDatabaseConnected(true);
      }
    } catch (err) {
      console.warn('[MongoDB API] Lỗi cập nhật bài viết vào MongoDB:', err);
    }
  };

  // Delete post from MongoDB & local state
  const deletePost = async (id) => {
    // Optimistic UI update
    setPosts((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      if (activePostId === id && filtered.length > 0) {
        setActivePostId(filtered[0].id);
      }
      return filtered;
    });

    // Send delete to MongoDB Backend
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setIsDatabaseConnected(true);
      }
    } catch (err) {
      console.warn('[MongoDB API] Lỗi xóa bài viết khỏi MongoDB:', err);
    }
  };

  // Toggle status (published <-> draft) in MongoDB & local state
  const togglePostStatus = async (id) => {
    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: p.status === 'published' ? 'draft' : 'published' }
          : p
      )
    );

    // Send toggle to MongoDB Backend
    try {
      const res = await fetch(`/api/posts/${id}/toggle-status`, {
        method: 'PATCH'
      });
      if (res.ok) {
        setIsDatabaseConnected(true);
      }
    } catch (err) {
      console.warn('[MongoDB API] Lỗi đổi trạng thái bài viết trên MongoDB:', err);
    }
  };

  // Reset to default sample posts in MongoDB & local state
  const resetToDefaults = async () => {
    setPosts(INITIAL_POSTS);
    setActivePostId('post-1');

    try {
      const res = await fetch('/api/posts/seed', {
        method: 'POST'
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          setPosts(result.data);
          setIsDatabaseConnected(true);
        }
      }
    } catch (err) {
      console.warn('[MongoDB API] Lỗi seed dữ liệu mặc định vào MongoDB:', err);
    }
  };

  // Stats calculation
  const totalPosts = posts.length;
  const draftPosts = posts.filter((p) => p.status === 'draft');
  const totalViews = posts.reduce((acc, p) => acc + (p.views || 0), 0);

  // Popular posts sorted by views
  const popularPosts = [...posts].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);

  return (
    <BlogContext.Provider
      value={{
        posts,
        activePost,
        activePostId,
        selectPost: handleSelectPost,
        createPost,
        updatePost,
        deletePost,
        togglePostStatus,
        resetToDefaults,
        refetchPosts: fetchPostsFromDB,
        isLoading,
        isDatabaseConnected,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        postStatusError,
        setPostStatusError,
        isPreviewMode,
        setIsPreviewMode,
        temporaryPreviewPost,
        setTemporaryPreviewPost,
        clearPreviewPost,
        publishedPosts,
        draftPosts,
        popularPosts,
        stats: {
          totalPosts,
          publishedCount: publishedPosts.length,
          draftCount: draftPosts.length,
          totalViews
        }
      }}
    >
      {children}
    </BlogContext.Provider>
  );
}

export function useBlog() {
  const context = useContext(BlogContext);
  if (!context) {
    throw new Error('useBlog must be used within a BlogProvider');
  }
  return context;
}

