"use client";
import * as React from "react";
import { NoteItem } from "./NoteItem";

interface Note {
  id: string;
  title: string;
  timeAgo: string;
}

interface NotesListProps {
  notes?: Note[];
  onNoteClick?: (noteId: string) => void;
}

export const NotesList: React.FC<NotesListProps> = ({
  notes = [
    { id: "1", title: "Note title", timeAgo: "5 hrs ago" },
    { id: "2", title: "Note title", timeAgo: "5 hrs ago" },
    { id: "3", title: "Note title", timeAgo: "5 hrs ago" },
    { id: "4", title: "Note title", timeAgo: "5 hrs ago" },
  ],
  onNoteClick,
}) => {
  return (
    <section className="mt-10 w-full">
      <div className="space-y-2">
        {notes.map((note, index) => (
          <NoteItem
            key={note.id}
            title={note.title}
            timeAgo={note.timeAgo}
            onClick={() => onNoteClick?.(note.id)}
          />
        ))}
      </div>
    </section>
  );
};
