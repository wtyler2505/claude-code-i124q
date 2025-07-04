# React State Management

Implement state management solutions for React applications.

## Usage

Run this command to set up state management:

```bash
claude state-management
```

## What This Command Does

- Sets up state management with Redux Toolkit, Zustand, or Context API
- Creates store configuration and slices
- Implements proper TypeScript typing for state
- Generates providers and hooks for state access
- Provides middleware setup for debugging and persistence

## Examples

### Redux Toolkit Setup

```typescript
// store.ts
import { configureStore } from '@reduxjs/toolkit';
import counterSlice from './slices/counterSlice';

export const store = configureStore({
  reducer: {
    counter: counterSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### Zustand Store

```typescript
// useStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface AppState {
  count: number;
  increment: () => void;
  decrement: () => void;
}

export const useStore = create<AppState>()(
  devtools(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
      decrement: () => set((state) => ({ count: state.count - 1 })),
    }),
    {
      name: 'app-store',
    }
  )
);
```

### Context API Pattern

```typescript
// ThemeContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
```

## Best Practices

- Choose the right state management solution for your needs
- Use TypeScript for type safety
- Implement proper error boundaries
- Keep state as local as possible
- Use selectors for performance optimization
- Include proper testing strategies