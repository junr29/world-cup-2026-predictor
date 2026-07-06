// 布局组件 - 包含导航栏
import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Trophy, Home, BarChart2, BarChart3, ChevronDown } from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  const [showPredictionMenu, setShowPredictionMenu] = useState(false);
  
  const isPredictionPage = location.pathname === '/predictions';

  const navItems = [
    { path: '/', icon: Home, label: '比赛中心' },
    { path: '/analysis', icon: BarChart3, label: '数据中心' }
  ];

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* 顶部导航 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#1a472a]/95 backdrop-blur border-b border-[#d4af37]/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <NavLink to="/" className="flex items-center gap-2 group">
              <Trophy className="w-8 h-8 text-[#d4af37] group-hover:animate-pulse" />
              <span className="text-xl font-bold text-white tracking-tight">
                2026世界杯预测
              </span>
            </NavLink>

            {/* 导航链接 */}
            <nav className="flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      isActive
                        ? 'bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/50'
                        : 'text-gray-400 hover:text-white hover:bg-[#1a472a]/50'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </NavLink>
              ))}

              {/* 预测排行下拉菜单 */}
              <div className="relative">
                <button
                  onClick={() => setShowPredictionMenu(!showPredictionMenu)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    isPredictionPage
                      ? 'bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/50'
                      : 'text-gray-400 hover:text-white hover:bg-[#1a472a]/50'
                  }`}
                >
                  <BarChart2 className="w-5 h-5" />
                  <span className="text-sm font-medium">预测排行</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showPredictionMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showPredictionMenu && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-[#1a1a1a] border border-[#d4af37]/30 rounded-lg shadow-xl py-2 z-50">
                    <NavLink
                      to="/predictions"
                      onClick={() => setShowPredictionMenu(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-[#d4af37] hover:bg-[#1a472a]/50"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#d4af37]" />
                      比分预测排行
                    </NavLink>
                    <NavLink
                      to="/predictions#half-full-time"
                      onClick={() => setShowPredictionMenu(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-[#d4af37] hover:bg-[#1a472a]/50"
                    >
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                      半全场预测排行
                    </NavLink>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="pt-16">
        <Outlet />
      </main>

      {/* 底部信息 */}
      <footer className="bg-[#1a472a]/50 border-t border-[#d4af37]/20 py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            2026世界杯比分预测系统 | 数据仅供娱乐参考，不构成任何投资建议
          </p>
        </div>
      </footer>
    </div>
  );
}