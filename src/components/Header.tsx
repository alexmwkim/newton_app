"use client";
import * as React from "react";

interface HeaderProps {
  backIconUrl?: string;
  searchIconUrl?: string;
  menuIconUrl?: string;
}

export const Header: React.FC<HeaderProps> = ({
  backIconUrl = "https://cdn.builder.io/api/v1/image/assets/TEMP/cdb47abf5f5a9915286190d71cc5768c65ba4f61?placeholderIfAbsent=true&apiKey=f9486c224b8f46c285dffe4da8cb62bb",
  searchIconUrl = "https://cdn.builder.io/api/v1/image/assets/TEMP/d9e04774024bd3b320272488013e02846961601a?placeholderIfAbsent=true&apiKey=f9486c224b8f46c285dffe4da8cb62bb",
  menuIconUrl = "https://cdn.builder.io/api/v1/image/assets/TEMP/2613e4caad5abcb1e620c6fa785750efb738e2b2?placeholderIfAbsent=true&apiKey=f9486c224b8f46c285dffe4da8cb62bb",
}) => {
  return (
    <nav className="flex gap-10 justify-between items-center w-full">
      <button className="shrink-0 self-stretch my-auto" aria-label="Go back">
        <img
          src={backIconUrl}
          alt="Back"
          className="object-contain aspect-square w-[42px]"
        />
      </button>
      <div className="flex gap-8 items-start self-stretch my-auto min-h-6 w-[77px]">
        <button aria-label="Search">
          <img
            src={searchIconUrl}
            alt="Search"
            className="object-contain shrink-0 w-6 aspect-square"
          />
        </button>
        <button aria-label="Menu">
          <img
            src={menuIconUrl}
            alt="Menu"
            className="object-contain shrink-0 w-6 aspect-square"
          />
        </button>
      </div>
    </nav>
  );
};
