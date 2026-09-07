import React from 'react';
import Header from './components/Header';
import Breadcrumbs from './components/Breadcrumbs';
import ArticleHeader from './components/ArticleHeader';
import ArticleBody from './components/ArticleBody';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import { useTheme } from './context/ThemeContext';

export default function BlogDetailPage({ onNavigate }) {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-rose-500 selection:text-white bg-[#f8fafc] dark:bg-[#100c18] text-slate-900 dark:text-[#e8dff1] transition-colors duration-300">
      {/* Header */}
      <Header isDarkMode={isDarkMode} onToggleTheme={toggleTheme} onNavigate={onNavigate} />

      {/* SubNavigation & Breadcrumbs */}
      <Breadcrumbs onNavigate={onNavigate} />

      {/* Main Content Grid */}
      <main className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8 py-4 w-full flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* Left Column: Article Content (8 cols) */}
          <article className="lg:col-span-8 flex flex-col">
            <ArticleHeader />
            <ArticleBody />
          </article>

          {/* Right Column: Sidebar (4 cols - Sticky) */}
          <Sidebar />

        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
