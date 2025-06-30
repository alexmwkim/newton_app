"use client";
import * as React from "react";

interface StatusBarProps {
  time?: string;
  batteryIconUrl?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  time = "9:41",
  batteryIconUrl = "https://cdn.builder.io/api/v1/image/assets/TEMP/17181d4334747bc0f53991ed6dc6d08928e95434?placeholderIfAbsent=true&apiKey=f9486c224b8f46c285dffe4da8cb62bb",
}) => {
  return (
    <header className="flex gap-5 justify-between self-end w-full text-lg leading-none text-center text-black whitespace-nowrap font-[590] max-w-[341px]">
      <time className="my-auto text-black">{time}</time>
      <img
        src={batteryIconUrl}
        alt="Battery and signal indicators"
        className="object-contain shrink-0 max-w-full aspect-[2.59] w-[140px]"
      />
    </header>
  );
};
