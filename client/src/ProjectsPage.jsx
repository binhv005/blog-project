import React, { useState, useMemo } from 'react';
import { projectsData, filterCategories, processSteps } from './data/projectsData';

export default function ProjectsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModalProject, setSelectedModalProject] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [emailInput, setEmailInput] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Filter projects based on selected category and live search query
  const filteredProjects = useMemo(() => {
    return projectsData
      .filter((project) => !project.isFlagship) // Exclude flagship from standard grid
      .filter((project) => {
        const matchesCategory = selectedCategory === 'all' || project.category === selectedCategory;
        const query = searchQuery.trim().toLowerCase();
        const matchesSearch =
          !query ||
          project.title.toLowerCase().includes(query) ||
          project.desc.toLowerCase().includes(query) ||
          project.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          project.techStack.some((tech) => tech.toLowerCase().includes(query));

        return matchesCategory && matchesSearch;
      });
  }, [selectedCategory, searchQuery]);

  const flagshipProject = useMemo(() => {
    return projectsData.find((p) => p.isFlagship) || projectsData[0];
  }, []);

  const handleToggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!emailInput) return;
    setFormSubmitted(true);
    setTimeout(() => setFormSubmitted(false), 4000);
    setEmailInput('');
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 selection:bg-rose-500 selection:text-white ${isDarkMode ? 'bg-[#0c0915] text-slate-200' : 'bg-[#f8fafc] text-slate-800'}`}>
      
      {/* Dynamic Background Mesh */}
      <div 
        className="fixed inset-0 pointer-events-none -z-10 transition-opacity duration-500"
        style={{
          backgroundImage: isDarkMode
            ? `radial-gradient(circle at 15% 15%, rgba(88, 28, 135, 0.22) 0%, transparent 45%),
               radial-gradient(circle at 85% 12%, rgba(225, 29, 72, 0.16) 0%, transparent 42%),
               radial-gradient(circle at 50% 60%, rgba(30, 58, 138, 0.18) 0%, transparent 55%),
               radial-gradient(circle at 20% 90%, rgba(168, 85, 247, 0.12) 0%, transparent 45%)`
            : `radial-gradient(circle at 10% 20%, rgba(216, 180, 254, 0.3) 0%, transparent 45%),
               radial-gradient(circle at 90% 10%, rgba(254, 205, 211, 0.3) 0%, transparent 40%),
               radial-gradient(circle at 50% 80%, rgba(191, 219, 254, 0.3) 0%, transparent 50%)`
        }}
      />

      {/* ===================== HEADER ===================== */}
      <header className={`w-full border-b sticky top-0 z-40 backdrop-blur-md transition-colors ${isDarkMode ? 'border-purple-950/40 bg-[#0c0915]/80' : 'border-slate-200 bg-white/80'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <a href="#" className="flex items-center gap-3.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 flex flex-col items-center justify-center shadow-lg shadow-rose-600/30 group-hover:scale-105 transition-transform duration-300">
              <span className="text-white font-extrabold text-[11px] leading-tight tracking-tighter">DUDI</span>
              <span className="text-white/80 font-medium text-[7px] leading-tight tracking-widest uppercase">Software</span>
            </div>
            <span className={`font-bold text-xl tracking-tight transition-colors ${isDarkMode ? 'text-white group-hover:text-rose-400' : 'text-slate-900 group-hover:text-rose-600'}`}>
              DUDI Software
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className={`hidden md:flex items-center gap-8 text-[15px] font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            <a href="#" className="hover:text-rose-500 transition-colors">Trang chủ</a>
            <a href="#" className="hover:text-rose-500 transition-colors">Về chúng tôi</a>
            <a href="#" className="hover:text-rose-500 transition-colors">Dịch vụ</a>
            
            {/* Active Tab: Dự án */}
            <a href="#" className={`font-semibold relative after:content-[''] after:absolute after:-bottom-1.5 after:left-0 after:w-full after:h-0.5 after:bg-rose-500 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Dự án
            </a>
            
            <a href="#" className="hover:text-rose-500 transition-colors">Blog</a>
            <a href="#" className="hover:text-rose-500 transition-colors">Đánh giá</a>
          </nav>

          {/* Header Action Controls */}
          <div className="flex items-center gap-3.5">
            {/* Theme Toggle Button */}
            <button 
              onClick={handleToggleTheme}
              aria-label="Đổi theme sáng tối"
              className={`p-2.5 rounded-full border transition-colors ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border-white/10' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'}`}
              type="button"
            >
              {isDarkMode ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              )}
            </button>

            {/* Language Switcher */}
            <button className={`px-3.5 py-1.5 rounded-lg border text-xs font-semibold tracking-wide transition-colors ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/10' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'}`}>
              EN
            </button>

            {/* Primary CTA Contact Button */}
            <a 
              href="#contact-section" 
              className="px-5 py-2 text-sm font-semibold rounded-full text-white bg-gradient-to-r from-rose-500 via-rose-600 to-blue-600 hover:opacity-95 shadow-md shadow-rose-600/25 transition-all transform hover:-translate-y-0.5"
            >
              Liên hệ
            </a>
          </div>
        </div>
      </header>

      {/* ===================== HERO SECTION ===================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4 w-full">
        {/* Breadcrumb & Live Counter */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <nav aria-label="Breadcrumb" className={`text-xs sm:text-sm flex items-center space-x-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            <a href="#" className="hover:underline transition-colors">Trang chủ</a>
            <span className="text-slate-600">/</span>
            <span className="text-rose-500 font-medium">Dự án tiêu biểu</span>
          </nav>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>Hơn 50+ Dự án đã hoàn thành năm 2026</span>
          </div>
        </div>

        {/* Hero Title */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-block mb-3">
            <span className="px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest rounded-full bg-gradient-to-r from-rose-500/20 via-purple-500/20 to-blue-500/20 text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-blue-400 border border-purple-500/30">
              PORTFOLIO & CASE STUDIES
            </span>
          </div>
          <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Biến Tầm Nhìn Số Thành <br />
            <span className="bg-gradient-to-r from-rose-500 via-purple-400 to-blue-500 bg-clip-text text-transparent">
              Hiện Thực Đột Phá
            </span>
          </h1>
          <p className={`text-base sm:text-lg leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            DUDI Software đồng hành cùng các tập đoàn và startup công nghệ hàng đầu xây dựng các hệ sinh thái phần mềm quy mô lớn, an toàn, linh hoạt và tối ưu trải nghiệm người dùng.
          </p>

          {/* Key Metrics Strip */}
          <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t ${isDarkMode ? 'border-purple-900/30' : 'border-slate-200'}`}>
            <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
              <div className={`text-2xl sm:text-3xl font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>50+</div>
              <div className="text-xs text-slate-400 font-medium mt-1">Dự án bàn giao</div>
            </div>
            <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-500">99.8%</div>
              <div className="text-xs text-slate-400 font-medium mt-1">Khách hàng hài lòng</div>
            </div>
            <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-400">12+</div>
              <div className="text-xs text-slate-400 font-medium mt-1">Quốc gia phủ sóng</div>
            </div>
            <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-500">20M+</div>
              <div className="text-xs text-slate-400 font-medium mt-1">Người dùng cuối</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FLAGSHIP SPOTLIGHT ===================== */}
      {flagshipProject && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 w-full">
          <div className={`relative rounded-3xl overflow-hidden p-6 sm:p-8 lg:p-10 border shadow-2xl backdrop-blur-xl ${isDarkMode ? 'bg-[#141024]/80 border-purple-800/40' : 'bg-white/90 border-slate-200'}`}>
            
            {/* Ambient Lighting */}
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Media Preview */}
              <div className="lg:col-span-7 group">
                <div className="relative rounded-2xl overflow-hidden border border-purple-900/40 bg-[#151025] shadow-2xl">
                  <img 
                    src={flagshipProject.image} 
                    alt={flagshipProject.title} 
                    className="w-full h-80 sm:h-96 object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c0915] via-transparent to-transparent opacity-80" />
                  
                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-600 text-white shadow-lg">
                      {flagshipProject.badge}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-950/90 text-blue-300 border border-blue-500/30">
                      {flagshipProject.categoryLabel}
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> 
                      Trạng thái: Production Live
                    </span>
                    <span>Năm: {flagshipProject.year}</span>
                  </div>
                </div>
              </div>

              {/* Details & KPIs */}
              <div className="lg:col-span-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Dự án trọng điểm 2026</span>
                  </div>
                  <h2 className={`text-2xl sm:text-3xl font-extrabold mb-4 leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {flagshipProject.title}
                  </h2>
                  <p className={`text-sm sm:text-base leading-relaxed mb-6 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {flagshipProject.desc}
                  </p>

                  {/* KPI Boxes */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {flagshipProject.kpis.map((kpi, idx) => (
                      <div key={idx} className={`p-3 rounded-xl border text-center ${isDarkMode ? 'bg-purple-950/40 border-purple-800/30' : 'bg-slate-50 border-slate-200'}`}>
                        <div className={`text-lg sm:text-xl font-bold ${kpi.color}`}>{kpi.value}</div>
                        <div className="text-[11px] text-slate-400">{kpi.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Tech stack badges */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {flagshipProject.techStack.map((tech, i) => (
                      <span key={i} className={`px-2.5 py-1 text-xs rounded-md border ${isDarkMode ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3.5 pt-2">
                  <button 
                    onClick={() => setSelectedModalProject(flagshipProject)}
                    className="px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 group"
                  >
                    <span>Xem Chi Tiết Case Study</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                  </button>
                  <a 
                    href="#contact-section" 
                    className={`px-4 py-2.5 rounded-full text-sm font-medium border transition-colors ${isDarkMode ? 'text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border-white/10' : 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-300'}`}
                  >
                    Tư vấn giải pháp
                  </a>
                </div>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* ===================== FILTER & SEARCH BAR ===================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 w-full flex-grow">
        
        <div className={`flex flex-col md:flex-row items-center justify-between gap-4 mb-10 pb-6 border-b ${isDarkMode ? 'border-purple-900/30' : 'border-slate-200'}`}>
          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {filterCategories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all backdrop-blur-md border ${
                    isActive
                      ? 'bg-rose-600 border-rose-500 text-white shadow-md shadow-rose-600/25'
                      : isDarkMode
                      ? 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/[0.09] hover:text-white'
                      : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên, công nghệ..." 
              className={`w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-full border focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all ${
                isDarkMode 
                  ? 'bg-white/[0.04] border-purple-900/40 text-slate-200 placeholder-slate-500' 
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Project Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {filteredProjects.map((project) => (
              <div 
                key={project.id}
                className={`rounded-2xl overflow-hidden flex flex-col group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl border backdrop-blur-md ${
                  isDarkMode 
                    ? 'bg-[#141024]/80 border-purple-900/30 hover:border-rose-500/40 hover:shadow-rose-950/20' 
                    : 'bg-white/90 border-slate-200 hover:border-rose-300 hover:shadow-slate-300'
                }`}
              >
                {/* Image Cover */}
                <div className="relative h-48 overflow-hidden bg-slate-900">
                  <img 
                    src={project.image} 
                    alt={project.title} 
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#141024] via-transparent to-transparent opacity-80" />
                  
                  <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-950/80 text-rose-400 border border-rose-500/30 backdrop-blur-sm">
                    {project.categoryLabel}
                  </span>
                  
                  <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-black/60 text-slate-300 backdrop-blur-sm">
                    {project.year}
                  </span>
                </div>

                {/* Card Content */}
                <div className="p-6 flex-grow flex flex-col justify-between">
                  <div>
                    <h3 className={`text-lg font-bold mb-2 transition-colors ${isDarkMode ? 'text-white group-hover:text-rose-400' : 'text-slate-900 group-hover:text-rose-600'}`}>
                      {project.title}
                    </h3>
                    <p className={`text-xs sm:text-sm line-clamp-3 mb-4 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      {project.desc}
                    </p>

                    {/* Tech Badges */}
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {project.techStack.slice(0, 4).map((tech, idx) => (
                        <span key={idx} className={`px-2 py-0.5 text-[11px] rounded border ${isDarkMode ? 'bg-white/5 text-slate-300 border-white/5' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className={`pt-4 border-t flex items-center justify-between ${isDarkMode ? 'border-purple-900/30' : 'border-slate-100'}`}>
                    <span className="text-xs text-slate-400">
                      Khách hàng: <strong className={isDarkMode ? 'text-slate-200' : 'text-slate-800'}>{project.client}</strong>
                    </span>
                    <button 
                      onClick={() => setSelectedModalProject(project)}
                      className="text-xs font-semibold text-rose-500 hover:text-rose-400 flex items-center gap-1 group/btn"
                    >
                      <span>Chi tiết</span>
                      <svg className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="py-16 text-center">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl border flex items-center justify-center ${isDarkMode ? 'bg-purple-900/30 border-purple-700/40 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-500'}`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </div>
            <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Không tìm thấy dự án phù hợp</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">Vui lòng thử từ khóa tìm kiếm khác hoặc chọn tab "Tất cả dự án" để khám phá thêm.</p>
          </div>
        )}
      </main>

      {/* ===================== DEVELOPMENT PROCESS ===================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="w-1 h-4 bg-blue-500 rounded-full inline-block mb-2" />
          <h2 className={`text-2xl sm:text-3xl font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Quy Trình Phát Triển Chuẩn Quốc Tế
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            Đảm bảo tiến độ, chất lượng mã nguồn và an ninh mạng xuyên suốt mọi giai đoạn dự án.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {processSteps.map((step, idx) => (
            <div 
              key={idx}
              className={`p-6 rounded-2xl border-t-2 relative backdrop-blur-md border ${step.accent.split(' ')[0]} ${isDarkMode ? 'bg-[#141024]/80 border-purple-900/30' : 'bg-white/90 border-slate-200'}`}
            >
              <span className="text-3xl font-black text-rose-500/20 absolute top-4 right-4">{step.step}</span>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${step.accent.split(' ').slice(1).join(' ')}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </div>
              <h3 className={`text-base font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{step.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== CONTACT / CTA SECTION ===================== */}
      <section id="contact-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-12 w-full">
        <div className={`relative rounded-3xl overflow-hidden border p-8 sm:p-12 text-center shadow-2xl ${isDarkMode ? 'bg-gradient-to-r from-purple-950/60 via-[#151025] to-blue-950/60 border-purple-800/40' : 'bg-gradient-to-r from-rose-50 via-white to-blue-50 border-slate-300'}`}>
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="px-3.5 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-rose-950/80 text-rose-400 border border-rose-500/30">
              HỢP TÁC CÙNG CHÚNG TÔI
            </span>
            <h2 className={`text-2xl sm:text-4xl font-extrabold mt-4 mb-4 tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Bạn Có Dự Án Cần Triển Khai?
            </h2>
            <p className={`text-sm sm:text-base leading-relaxed mb-8 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Đội ngũ kiến trúc sư giải pháp của DUDI Software luôn sẵn sàng lắng nghe, tư vấn công nghệ và gửi báo giá chi tiết trong vòng 24 giờ.
            </p>

            <form onSubmit={handleContactSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
              <input 
                type="email" 
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Nhập email doanh nghiệp của bạn..." 
                required
                className={`flex-grow px-5 py-3 rounded-full border text-sm backdrop-blur-sm focus:outline-none focus:border-rose-500 ${isDarkMode ? 'bg-black/40 border-purple-800/60 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'}`}
              />
              <button 
                type="submit" 
                className="px-7 py-3 rounded-full font-semibold text-sm text-white bg-gradient-to-r from-rose-500 via-rose-600 to-blue-600 hover:opacity-95 shadow-lg shadow-rose-600/30 transition-transform transform hover:scale-105 flex-shrink-0"
              >
                Nhận Tư Vấn
              </button>
            </form>

            {formSubmitted && (
              <div className="mt-4 text-xs font-semibold text-emerald-400 animate-fadeIn">
                ✓ Cảm ơn bạn! Đội ngũ tư vấn DUDI Software sẽ liên hệ lại ngay trong 24h.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className={`w-full border-t py-12 mt-16 ${isDarkMode ? 'border-purple-950/40 bg-[#090710]/95' : 'border-slate-200 bg-slate-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 flex flex-col items-center justify-center shadow-lg shadow-rose-600/30">
                  <span className="text-white font-extrabold text-[10px] leading-tight tracking-tighter">DUDI</span>
                  <span className="text-white/80 font-medium text-[6px] leading-tight tracking-widest uppercase">Software</span>
                </div>
                <span className={`font-bold text-lg tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>DUDI Software</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Đơn vị tiên phong cung cấp giải pháp chuyển đổi số toàn diện, AI, FinTech và kiến trúc phần mềm quy mô lớn cho doanh nghiệp.
              </p>
            </div>

            <div>
              <h4 className={`text-xs font-bold tracking-wider uppercase mb-4 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>ĐIỀU HƯỚNG</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><a href="#" className="hover:text-rose-500 transition-colors">Về chúng tôi</a></li>
                <li><a href="#" className="hover:text-rose-500 transition-colors">Dịch vụ phần mềm</a></li>
                <li><a href="#" className="hover:text-rose-500 transition-colors">Dự án tiêu biểu</a></li>
                <li><a href="#" className="hover:text-rose-500 transition-colors">Tin tức & Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className={`text-xs font-bold tracking-wider uppercase mb-4 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>DỊCH VỤ CÔNG NGHỆ</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><a href="#" className="hover:text-rose-500 transition-colors">Phát triển Web Enterprise</a></li>
                <li><a href="#" className="hover:text-rose-500 transition-colors">Ứng dụng Di Động iOS & Android</a></li>
                <li><a href="#" className="hover:text-rose-500 transition-colors">Giải Pháp Trí Tuệ Nhân Tạo (AI)</a></li>
                <li><a href="#" className="hover:text-rose-500 transition-colors">Bảo Mật Hệ Thống & Cloud SOC</a></li>
              </ul>
            </div>

            <div>
              <h4 className={`text-xs font-bold tracking-wider uppercase mb-4 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>LIÊN HỆ</h4>
              <p className="text-xs text-slate-400 mb-2">Tòa nhà Innovation Hub, Quận Cầu Giấy, TP. Hà Nội</p>
              <p className="text-xs text-slate-400 mb-2">Email: contact@dudi-software.com</p>
              <p className="text-xs text-slate-400">Hotline: +84 (0) 24 8888 9999</p>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 text-center text-xs text-slate-500 font-medium">
            <p>© 2026 DUDI Software. All rights reserved. React + Tailwind CSS Edition.</p>
          </div>
        </div>
      </footer>

      {/* ===================== PROJECT DETAIL MODAL ===================== */}
      {selectedModalProject && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setSelectedModalProject(null)}
        >
          <div 
            className={`relative w-full max-w-3xl rounded-3xl border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col ${isDarkMode ? 'bg-[#141024] border-purple-700/40 text-slate-200' : 'bg-white border-slate-300 text-slate-800'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`p-6 border-b flex items-center justify-between ${isDarkMode ? 'border-purple-900/40' : 'border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-600/20 text-rose-400 border border-rose-500/30">
                  {selectedModalProject.categoryLabel}
                </span>
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {selectedModalProject.title}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedModalProject(null)}
                className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm leading-relaxed">
              <div className="rounded-xl overflow-hidden h-64 w-full bg-slate-900 border border-white/5">
                <img 
                  src={selectedModalProject.image} 
                  alt={selectedModalProject.title} 
                  className="w-full h-full object-cover object-center"
                />
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-2">MÔ TẢ TỔNG QUAN</h4>
                <p className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
                  {selectedModalProject.desc}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-2">KẾT QUẢ & GIÁ TRỊ ĐẠT ĐƯỢC</h4>
                <ul className="space-y-2 list-disc list-inside text-slate-400">
                  {selectedModalProject.highlights.map((h, idx) => (
                    <li key={idx} className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>{h}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-2">CÔNG NGHỆ ÁP DỤNG</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedModalProject.techStack.map((tech, idx) => (
                    <span 
                      key={idx} 
                      className={`px-2.5 py-1 text-xs rounded-md border font-medium ${isDarkMode ? 'bg-white/5 border-purple-500/30 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-700'}`}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`p-4 border-t flex items-center justify-between ${isDarkMode ? 'bg-[#0e0a1b] border-purple-900/40' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-xs text-slate-500 font-medium">DUDI Software Case Studies 2026</span>
              <div className="flex gap-3">
                <button 
                  onClick={() => setSelectedModalProject(null)}
                  className={`px-4 py-2 rounded-full text-xs font-medium border transition-colors ${isDarkMode ? 'text-slate-300 bg-white/5 hover:bg-white/10 border-white/10' : 'text-slate-700 bg-slate-200 hover:bg-slate-300 border-slate-300'}`}
                >
                  Đóng
                </button>
                <a 
                  href="#contact-section" 
                  onClick={() => setSelectedModalProject(null)}
                  className="px-5 py-2 rounded-full text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/30 transition-colors"
                >
                  Yêu cầu giải pháp này
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
