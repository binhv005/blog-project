export const projectsData = [
  {
    id: 'nexa-id',
    title: 'NexaID: Hệ Thống Định Danh Số & Xác Thực Đa Kênh',
    category: 'fintech',
    categoryLabel: 'FinTech & Security',
    year: '2026',
    client: 'National ID Dept',
    badge: '★ FLAGSHIP SPOTLIGHT',
    isFlagship: true,
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    desc: 'Giải pháp kiến trúc vi dịch vụ phân tán, tích hợp nhận diện sinh trắc học eKYC và bảo mật đa lớp chuẩn Nghị định 320/2026/NĐ-CP. Cho phép hàng triệu người dùng hoàn thành quy trình định danh trong chưa đầy 3 giây.',
    kpis: [
      { value: '3.2s', label: 'Thời gian eKYC', color: 'text-emerald-400' },
      { value: '99.99%', label: 'Độ ổn định hệ thống', color: 'text-rose-400' },
      { value: '5M+', label: 'Tài khoản xác thực', color: 'text-blue-400' }
    ],
    highlights: [
      'Rút ngắn thời gian hoàn tất xác thực eKYC chỉ còn 3.2 giây trung bình.',
      'Khả năng chịu tải đồng thời hơn 100.000 requests/giây với độ trễ dưới 80ms.',
      'Hệ số sẵn sàng đạt SLA 99.99% trên cụm Multi-Region Kubernetes.',
      'Tích hợp bảo mật sinh trắc học chống giả mạo (Anti-Spoofing Liveness Level 2).'
    ],
    tags: ['react', 'nextjs', 'golang', 'microservices', 'python', 'ai', 'ekyc', 'kafka', 'kubernetes'],
    techStack: ['Next.js 15', 'Go Microservices', 'Python AI / eKYC', 'Apache Kafka', 'PostgreSQL Distributed', 'Kubernetes']
  },
  {
    id: 'omnipay',
    title: 'OmniPay: Cổng Thanh Toán Đa Tiền Tệ',
    category: 'fintech',
    categoryLabel: 'FinTech',
    year: '2026',
    client: 'Global Fin Corp',
    colorAccent: 'rose',
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
    desc: 'Hệ thống xử lý giao dịch thanh toán thời gian thực cho hơn 200+ sàn thương mại điện tử quốc tế với chuẩn bảo mật PCI-DSS Level 1.',
    highlights: [
      'Đạt chứng nhận an toàn quốc tế PCI-DSS Level 1.',
      'Tỷ lệ hoàn tất giao dịch thanh toán thành công tăng 24% so với cổng cũ.',
      'Tự động định tuyến qua hơn 15 cổng trung gian theo chi phí tối ưu.'
    ],
    tags: ['react', 'nodejs', 'fintech', 'banking', 'postgresql', 'redis'],
    techStack: ['React 19', 'Node.js Fastify', 'PostgreSQL', 'Redis Cache', 'Docker', 'AWS KMS']
  },
  {
    id: 'medvision',
    title: 'MedVision AI: Chẩn Đoán Hình Ảnh Y Khoa',
    category: 'ai',
    categoryLabel: 'AI & Big Data',
    year: '2025 - 2026',
    client: 'VinCare Health',
    colorAccent: 'purple',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
    desc: 'Nền tảng trí tuệ nhân tạo hỗ trợ phân tích hình ảnh X-quang, MRI và CT scan với độ chính xác đạt 98.4%, giảm tải 65% thời gian cho bác sĩ.',
    highlights: [
      'Độ chính xác chuẩn đoán tổng thể đạt 98.4% theo kiểm định độc lập.',
      'Tối ưu thời gian đọc phim của bác sĩ từ 15 phút xuống dưới 2 phút/ca.',
      'Tuân thủ đầy đủ chuẩn lưu trữ hình ảnh y tế quốc tế DICOM/HL7.'
    ],
    tags: ['python', 'ai', 'pytorch', 'healthcare', 'medical', 'vision', 'fastapi'],
    techStack: ['PyTorch', 'TensorRT', 'FastAPI', 'Vue.js 3', 'MinIO Storage', 'NVIDIA Triton']
  },
  {
    id: 'logixflow',
    title: 'LogixFlow: Quản Trị Chuỗi Cung Ứng Toàn Cầu',
    category: 'enterprise',
    categoryLabel: 'Web Enterprise',
    year: '2025',
    client: 'AeroLogix Asia',
    colorAccent: 'blue',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
    desc: 'Hệ thống ERP phân tán theo dõi luồng hàng hóa, tự động định tuyến thông minh theo thời gian thực tại hơn 45 kho vận trung tâm.',
    highlights: [
      'Giảm 32% chi phí lưu kho thừa nhờ thuật toán dự báo thông minh.',
      'Tự động hóa 90% nghiệp vụ xuất nhập kho và lập báo cáo hải quan.',
      'Hỗ trợ tích hợp EDI với các hãng tàu vận tải biển lớn nhất thế giới.'
    ],
    tags: ['nextjs', 'nestjs', 'logistics', 'supplychain', 'enterprise', 'cloud', 'mongodb'],
    techStack: ['Next.js 14', 'NestJS', 'MongoDB Enterprise', 'RabbitMQ', 'Docker Swarm']
  },
  {
    id: 'smartlife',
    title: 'SmartLife: Siêu Ứng Dụng Đô Thị Thông Minh',
    category: 'mobile',
    categoryLabel: 'Mobile App',
    year: '2026',
    client: 'UrbanTech City',
    colorAccent: 'emerald',
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80',
    desc: 'Ứng dụng đa nền tảng Flutter tích hợp quản lý căn hộ, thanh toán dịch vụ tiện ích, điều khiển IoT smart home và kết nối cộng đồng cư dân.',
    highlights: [
      'Đạt hơn 100.000+ lượt tải trên App Store và Google Play với đánh giá 4.8 sao.',
      'Tốc độ mở cửa Smart Door qua BLE dưới 0.5 giây.',
      'Tiết kiệm 40% chi phí quản lý vận hành tòa nhà.'
    ],
    tags: ['flutter', 'mobile', 'ios', 'android', 'superapp', 'smartcity', 'golang', 'iot'],
    techStack: ['Flutter 3.x', 'Golang Microservices', 'MQTT Broker', 'GraphQL', 'Firebase']
  },
  {
    id: 'cybershield',
    title: 'CyberShield: Giám Sát An Ninh Mạng Tự Động (SOC)',
    category: 'security',
    categoryLabel: 'Bảo Mật & Cloud',
    year: '2025 - 2026',
    client: 'TrustBank Corp',
    colorAccent: 'amber',
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
    desc: 'Giải pháp SIEM & SOAR thế hệ mới ứng dụng machine learning phát hiện xâm nhập trái phép, ngăn chặn tấn công DDoS và mã độc theo thời gian thực.',
    highlights: [
      'Giảm thời gian phát hiện và phản ứng sự cố (MTTD & MTTR) xuống dưới 60 giây.',
      'Tự động khóa 99.7% cuộc tấn công thăm dò cổng và brute-force mật khẩu.',
      'Đáp ứng các tiêu chuẩn bảo mật ISO 27001 và NIST Cybersecurity Framework.'
    ],
    tags: ['security', 'soc', 'devops', 'siem', 'cloud', 'cybersecurity', 'rust', 'ebpf'],
    techStack: ['Rust', 'eBPF', 'Elasticsearch', 'Kibana', 'AWS Security Hub', 'Terraform']
  },
  {
    id: 'edumaster',
    title: 'EduMaster: Hệ Thống Đào Tạo & Khảo Thí Trực Tuyến',
    category: 'enterprise',
    categoryLabel: 'Web Enterprise',
    year: '2025',
    client: 'EduGroup Int.',
    colorAccent: 'pink',
    image: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&w=800&q=80',
    desc: 'Hạ tầng đào tạo trực tuyến cho 500.000 học viên với phòng học ảo WebRTC độ trễ thấp và giám thị thi tự động bằng camera AI.',
    highlights: [
      'Hỗ trợ lớp học ảo đồng thời lên đến 5.000 học viên trong một phiên live.',
      'Giảm 75% băng thông truyền video nhờ thuật toán adaptive bitrate HLS tùy biến.',
      'Tỷ lệ hoàn thành khóa học của học viên tăng 35% nhờ gamification.'
    ],
    tags: ['edtech', 'lms', 'elearning', 'react', 'tailwind', 'video', 'webrtc'],
    techStack: ['React 18', 'WebRTC / Mediasoup', 'PostgreSQL', 'Redis', 'HLS Streaming', 'Tailwind CSS']
  }
];

export const filterCategories = [
  { id: 'all', label: 'Tất cả dự án' },
  { id: 'fintech', label: 'FinTech & Banking' },
  { id: 'ai', label: 'AI & Big Data' },
  { id: 'enterprise', label: 'Web Enterprise' },
  { id: 'mobile', label: 'Mobile Apps' },
  { id: 'security', label: 'Bảo Mật & Cloud' }
];

export const processSteps = [
  {
    step: '01',
    title: 'Khảo Sát & Kiến Trúc',
    desc: 'Phân tích sâu nhu cầu nghiệp vụ, mô hình dữ liệu và lựa chọn kiến trúc phần mềm tối ưu.',
    accent: 'border-t-rose-500 text-rose-400 bg-rose-500/10'
  },
  {
    step: '02',
    title: 'Thiết Kế UI/UX & Prototype',
    desc: 'Xây dựng trải nghiệm người dùng trực quan, chuẩn Design System hiện đại và tinh tế.',
    accent: 'border-t-purple-500 text-purple-400 bg-purple-500/10'
  },
  {
    step: '03',
    title: 'Phát Triển & Kiểm Thử Agile',
    desc: 'Sprint 2 tuần linh hoạt, CI/CD tự động hóa, kiểm thử bảo mật SonarQube & Pentest.',
    accent: 'border-t-blue-500 text-blue-400 bg-blue-500/10'
  },
  {
    step: '04',
    title: 'Triển Khai & Vận Hành 24/7',
    desc: 'Deploy hạ tầng Cloud, cấu hình giám sát SLA 99.99% và chuyển giao công nghệ toàn diện.',
    accent: 'border-t-emerald-500 text-emerald-400 bg-emerald-500/10'
  }
];
