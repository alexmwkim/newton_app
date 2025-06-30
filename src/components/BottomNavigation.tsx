"use client";
import * as React from "react";

interface BottomNavigationProps {
  homeIconUrl?: string;
  searchIconUrl?: string;
  bookmarkIconUrl?: string;
  profileIconUrl?: string;
  activeTab?: number;
  onTabChange?: (tabIndex: number) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  homeIconUrl = "https://cdn.builder.io/api/v1/image/assets/TEMP/66e1650a376647259ef67c3d79c0c9cbaccf10e3?placeholderIfAbsent=true&apiKey=f9486c224b8f46c285dffe4da8cb62bb",
  searchIconUrl = "https://cdn.builder.io/api/v1/image/assets/TEMP/9c235a77cdb295dc9945780c0472219a3a7f8d7f?placeholderIfAbsent=true&apiKey=f9486c224b8f46c285dffe4da8cb62bb",
  bookmarkIconUrl = "https://cdn.builder.io/api/v1/image/assets/TEMP/bde7dc6980e7c1418f57302f0ffff69fd3c99813?placeholderIfAbsent=true&apiKey=f9486c224b8f46c285dffe4da8cb62bb",
  profileIconUrl = "https://cdn.builder.io/api/v1/image/assets/TEMP/1a60038b21a5c739c70901126c3821761d46eaf2?placeholderIfAbsent=true&apiKey=f9486c224b8f46c285dffe4da8cb62bb",
  activeTab = 0,
  onTabChange,
}) => {
  const navItems = [
    { icon: homeIconUrl, label: "Home" },
    { icon: searchIconUrl, label: "Search" },
    { icon: bookmarkIconUrl, label: "Bookmarks" },
    { icon: profileIconUrl, label: "Profile" },
  ];

  return (
    <nav
      className="flex flex-col justify-center py-8 pr-9 pl-9 mt-5 w-full bg-white bg-opacity-70 rounded-[40px] shadow-[0px_0px_4px_rgba(0,0,0,0.08)]"
      role="tablist"
    >
      <div className="flex gap-10 items-center">
        {navItems.map((item, index) => (
          <button
            key={index}
            className={`shrink-0 self-stretch my-auto transition-opacity ${
              activeTab === index
                ? "opacity-100"
                : "opacity-60 hover:opacity-80"
            }`}
            onClick={() => onTabChange?.(index)}
            role="tab"
            aria-selected={activeTab === index}
            aria-label={item.label}
          >
            <img
              src={item.icon}
              alt={item.label}
              className="object-contain w-6 aspect-square"
            />
          </button>
        ))}
      </div>
    </nav>
  );
};
