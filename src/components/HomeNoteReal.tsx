"use client";
import * as React from "react";
import { StatusBar } from "./StatusBar";
import { Header } from "./Header";
import { ToggleButtons } from "./ToggleButtons";
import { NotesList } from "./NotesList";
import { CreateButton } from "./CreateButton";
import { BottomNavigation } from "./BottomNavigation";

interface HomeNoteRealProps {
  onCreateNote?: () => void;
  onNoteClick?: (noteId: string) => void;
  onNavigationChange?: (tabIndex: number) => void;
}

export const HomeNoteReal: React.FC<HomeNoteRealProps> = ({
  onCreateNote,
  onNoteClick,
  onNavigationChange,
}) => {
  const [activeTab, setActiveTab] = React.useState<"private" | "public">(
    "private",
  );
  const [activeNavTab, setActiveNavTab] = React.useState(0);

  const handleTabChange = (tab: "private" | "public") => {
    setActiveTab(tab);
  };

  const handleNavChange = (tabIndex: number) => {
    setActiveNavTab(tabIndex);
    onNavigationChange?.(tabIndex);
  };

  return (
    <main className="flex overflow-hidden flex-col pb-4 pl-4 mx-auto w-full bg-white max-w-[480px]">
      <StatusBar />

      <div className="self-start mt-6">
        <div className="flex flex-col w-full">
          <Header />

          <ToggleButtons activeTab={activeTab} onTabChange={handleTabChange} />

          <NotesList onNoteClick={onNoteClick} />
        </div>

        <div className="flex flex-col mt-32 w-full">
          <CreateButton onClick={onCreateNote} />
          <BottomNavigation
            activeTab={activeNavTab}
            onTabChange={handleNavChange}
          />
        </div>
      </div>
    </main>
  );
};

export default HomeNoteReal;
