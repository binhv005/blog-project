import React, { useState } from 'react';
import Header from './components/Header';
import Breadcrumbs from './components/Breadcrumbs';
import ArticleHeader from './components/ArticleHeader';
import ArticleBody from './components/ArticleBody';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';

export default function BlogDetailPage({ onNavigate }) {
  const [isDarkMode, setIsDarkMode] = useState(true);

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

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Header */}
      <Header isDarkMode={isDarkMode} onToggleTheme={handleToggleTheme} onNavigate={onNavigate} />

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
