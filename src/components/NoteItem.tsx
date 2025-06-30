"use client";
import * as React from "react";

interface NoteItemProps {
  title?: string;
  timeAgo?: string;
  onClick?: () => void;
}

export const NoteItem: React.FC<NoteItemProps> = ({
  title = "Note title",
  timeAgo = "5 hrs ago",
  onClick,
}) => {
  return (
    <article
      className="flex flex-col justify-center items-start p-4 w-full rounded-xl bg-stone-100 min-h-[72px] cursor-pointer hover:bg-stone-200 transition-colors"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className="w-[71px]">
        <h3 className="text-base font-medium tracking-tight text-black">
          {title}
        </h3>
        <time className="mt-1 text-xs tracking-tight text-stone-400">
          {timeAgo}
        </time>
      </div>
    </article>
  );
};
