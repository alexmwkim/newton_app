"use client";
import * as React from "react";

interface CreateButtonProps {
  iconUrl?: string;
  onClick?: () => void;
}

export const CreateButton: React.FC<CreateButtonProps> = ({
  iconUrl = "https://cdn.builder.io/api/v1/image/assets/TEMP/25fc2c278800cc537469068bbfce7650455f9243?placeholderIfAbsent=true&apiKey=f9486c224b8f46c285dffe4da8cb62bb",
  onClick,
}) => {
  return (
    <button
      className="flex gap-1 justify-center items-center self-center px-4 py-3 text-lg font-medium tracking-normal text-white bg-orange-400 rounded-[30px] hover:bg-orange-500 transition-colors"
      onClick={onClick}
    >
      <img
        src={iconUrl}
        alt=""
        className="object-contain shrink-0 self-stretch my-auto w-5 aspect-square"
      />
      <span className="self-stretch my-auto">Create new</span>
    </button>
  );
};
