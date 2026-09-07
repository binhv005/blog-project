# Kiến Trúc & Logic Hệ Thống Blog & Admin Blog - DUDI Software

Tài liệu này mô tả toàn bộ kiến trúc luồng dữ liệu, logic nghiệp vụ và các tính năng đã được chuyển đổi hoàn chỉnh sang **ReactJS + Tailwind CSS** giữa giao diện **Blog người dùng (Client)** và **Trình soạn thảo quản trị bài viết (Admin Document Editor & Dashboard)**.

---

## 1. Cấu Trúc Dự Án (Project Structure)

```text
Practice4/
├── public/
│   └── logo-dudi.webp              # File ảnh logo thương hiệu DUDI Software
├── src/
│   ├── context/
│   │   └── BlogContext.jsx         # Quản lý State tập trung & Đồng bộ localStorage (CRUD, Search, Filter, Stats)
│   ├── components/
│   │   ├── admin/
│   │   │   ├── AdminEditor.jsx     # Trình soạn thảo văn bản phong cách Word/Notion Dark Mode cao cấp
│   │   │   ├── AdminSidebar.jsx    # Sidebar chuẩn DUDI SOFTWARE PRO, menu: Quản lý bài viết, Tổng quan, Danh mục...
│   │   │   ├── AdminHeader.jsx     # Header top: Search Ctrl+K, Chuông thông báo, Avatar Alex Vũ (Super Admin)
│   │   │   ├── PostsManager.jsx    # Giao diện quản lý danh sách bài viết (Search, Lọc chuyên mục, Sửa, Xóa, Xuất bản)
│   │   │   ├── ViewsChartCard.jsx  # Card Lượt xem: Biểu đồ sóng SVG tương tác
│   │   │   ├── TimelineUpdatesCard.jsx # Card Cập nhật mới: Timeline hoạt động
│   │   │   ├── PopularPostsCard.jsx    # Card Bài viết phổ biến: Top bài viết nhiều lượt xem nhất
│   │   │   └── AtAGlanceCard.jsx   # Card Tổng quan nhanh: Thống kê tổng bài, bài đã xuất bản, tổng lượt đọc
│   │   ├── Header.jsx              # Navbar chính (Logo DUDI, Điều hướng Blog/Dự án/Admin, Theme sáng/tối)
│   │   ├── Breadcrumbs.jsx         # Thanh điều hướng phân cấp & tên bài viết động
│   │   ├── ArticleHeader.jsx       # Tiêu đề bài viết, tác giả, ngày đăng, thời gian đọc, lượt xem
│   │   ├── ArticleBody.jsx         # Nội dung bài viết động, ảnh bìa, sa-pô, các đoạn mục và tags
│   │   ├── Sidebar.jsx             # Danh sách bài viết liên quan động & Phân loại chuyên mục
│   │   └── Footer.jsx              # Footer bản quyền DUDI Software
│   ├── BlogDetailPage.jsx         # Trang hiển thị chi tiết bài viết Blog cho người đọc
│   ├── ProjectsPage.jsx           # Trang danh sách dự án Portfolio
│   ├── App.jsx                     # Entry router & Floating Quick Switcher (Blog, Dự án, Admin)
│   ├── main.jsx                    # Entry point React DOM
│   ├── index.css                   # Font Inter, Plus Jakarta Sans, JetBrains Mono & Tailwind base
│   └── tailwind.config.js          # Theme bảng màu surface, primary, secondary token
├── skill.md
└── package.json
```

---

## 2. Chi Tiết Trình Soạn Thảo Quản Trị Bài Viết (`AdminEditor.jsx`)

Được chuyển thể chính xác từ bản mẫu HTML sang component React tương tác cao:
1. **Sticky Sub-Header / Action Bar**:
   - Breadcrumb phân cấp: `Quản trị > Quản lý bài viết > Soạn thảo bài mới`.
   - Huy hiệu trạng thái tự động lưu (`Đã tự động lưu: 14:28:04`) với đèn xanh nhấp nháy.
   - Các nút thao tác nhanh: **Xem trước (Preview)**, **Lưu nháp (Save Draft)**, **Xuất bản (Publish CTA)** với hiệu ứng hào quang sáng hồng neon, nút ẩn/hiện Inspector Drawer.
2. **Thanh Công Cụ Word / Notion Ribbon Nổi (Sticky Toolbar)**:
   - Nhóm Hoàn tác / Làm lại (Undo / Redo).
   - Chọn định dạng đề mục (H1, H2, H3, Paragraph, Quote).
   - Định dạng chữ: In đậm (Ctrl+B), In nghiêng (Ctrl+I), Gạch chân (Ctrl+U), Gạch ngang, Màu chữ, Màu đánh dấu (Highlighter).
   - Căn lề đoạn văn: Căn trái, Căn giữa, Căn đều, Danh sách chấm, Danh sách số, Khối trích dẫn, Khối mã nguồn.
   - Chèn phương tiện: Chèn ảnh trực tiếp, Chèn video, Chèn bảng, Chèn link, Đường kẻ phân cách.
3. **Khu Vực Soạn Thảo Bản Giấy (Document Canvas - 8 cột)**:
   - Thiết kế mô phỏng trang giấy tối màu với dải quang phổ gradient trên đầu.
   - Thông tin tác giả Alex Vũ (Lead Architect), thời gian cập nhật và thẻ phân loại.
   - Tiêu đề bài viết và đoạn Sa-pô (Abstract Lead) dạng textarea co giãn mượt mà.
   - Menu popover nổi nhanh với tính năng **AI Polish**.
   - Khối đề mục đánh số (`01.`), khối trích dẫn callout dải màu gradient.
   - Khối hình ảnh tương tác với thanh tùy chọn căn lề/toàn màn hình/xóa và góc kéo co giãn.
   - Khối Code Snippet `service-auth-policy.yaml` với nút Sao chép.
   - Vùng kéo thả tệp / Slash Command dropzone (`cloud_upload`) và gợi ý phím `/`.
   - Vạch con trỏ màu hồng neon nhấp nháy tạo cảm giác đang soạn thảo trực tiếp.
4. **Bảng Điều Khiển Cài Đặt (Inspector Drawer - 4 cột)**:
   - **Cài đặt xuất bản**: Công tắc bật/tắt hiển thị công khai, lên lịch đăng bài theo ngày giờ, phân công tác giả biên tập.
   - **Ảnh bìa đại diện (Cover)**: Khung xem trước độ phân giải cao kèm thông số `1920x836 • 420 KB`, nút Thay đổi và Gỡ ảnh.
   - **Phân loại & Thẻ tags**: Chọn danh mục chính, đám mây tags hashtag tương tác (thêm tag bằng Enter và gỡ tag nhanh).
   - **Tối ưu SEO Google**: Điểm số SEO `94/100`, tùy chỉnh Slug URL `/blog/...`, bộ đếm ký tự Meta Description và khung xem trước kết quả Google trực tiếp.
   - **Chỉ số tài liệu (Telemetry Analytics)**: Đếm số từ (1,480 từ), ước lượng thời gian đọc (~5.5 phút), số lượng đề mục và tài nguyên media.

---

## 3. Khởi Chạy & Kiểm Thử Hệ Thống

```bash
# Chạy môi trường phát triển
npm run dev

# Kiểm tra build
npm run build
```

- Truy cập Blog: **`http://localhost:3000/#blog`**
- Truy cập Dự án: **`http://localhost:3000/#projects`**
- Truy cập Soạn thảo & Quản trị Admin: **`http://localhost:3000/#admin`**
