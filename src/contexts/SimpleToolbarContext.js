import React, { createContext, useContext, useState } from 'react';

const SimpleToolbarContext = createContext();

export const SimpleToolbarProvider = ({ children }) => {
  const [activeScreenHandlers, setActiveScreenHandlers] = useState(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  return (
    <SimpleToolbarContext.Provider value={{
      activeScreenHandlers,
      setActiveScreenHandlers,
      focusedIndex,
      setFocusedIndex
    }}>
      {children}
    </SimpleToolbarContext.Provider>
  );
};

export const useSimpleToolbar = () => {
  const context = useContext(SimpleToolbarContext);
  if (!context) {
    throw new Error('useSimpleToolbar must be used within SimpleToolbarProvider');
  }
  return context;
};