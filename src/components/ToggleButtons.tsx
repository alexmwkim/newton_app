"use client";
import * as React from "react";

interface ToggleButtonsProps {
  privateIconUrl?: string;
  publicIconUrl?: string;
  activeTab?: "private" | "public";
  onTabChange?: (tab: "private" | "public") => void;
}

export const ToggleButtons: React.FC<ToggleButtonsProps> = ({
  privateIconUrl = "https://cdn.builder.io/api/v1/image/assets/TEMP/c9bb6989056888dc283da2b4a363be7a4b975448?placeholderIfAbsent=true&apiKey=f9486c224b8f46c285dffe4da8cb62bb",
  publicIconUrl = "https://cdn.builder.io/api/v1/image/assets/TEMP/c428c53d3b6f7ee7b7989ffa9879f35137e2831e?placeholderIfAbsent=true&apiKey=f9486c224b8f46c285dffe4da8cb62bb",
  activeTab = "private",
  onTabChange,
}) => {
  return (
    <div className="flex gap-2 items-center self-start mt-10 text-base font-medium tracking-tight whitespace-nowrap">
      <button
        className={`flex gap-1 justify-center items-center self-stretch px-4 py-3 my-auto rounded-[30px] w-[95px] ${
          activeTab === "private"
            ? "text-white bg-black"
            : "text-black bg-white border border-solid border-stone-100"
        }`}
        onClick={() => onTabChange?.("private")}
        aria-pressed={activeTab === "private"}
      >
        <img
          src={privateIconUrl}
          alt=""
          className="object-contain shrink-0 self-stretch my-auto w-3 aspect-square"
        />
        <span className="self-stretch my-auto">Private</span>
      </button>
      <button
        className={`flex gap-1 justify-center items-center self-stretch px-4 py-3 my-auto rounded-[30px] w-[95px] ${
          activeTab === "public"
            ? "text-white bg-black"
            : "text-black bg-white border border-solid border-stone-100"
        }`}
        onClick={() => onTabChange?.("public")}
        aria-pressed={activeTab === "public"}
      >
        <img
          src={publicIconUrl}
          alt=""
          className="object-contain shrink-0 self-stretch my-auto w-3 aspect-square"
        />
        <span className="self-stretch my-auto">Public</span>
      </button>
    </div>
  );
};
