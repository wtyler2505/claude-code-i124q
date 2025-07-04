# React Hooks

Create and manage React hooks for your application.

## Usage

Run this command to create new React hooks or optimize existing ones:

```bash
claude hooks
```

## What This Command Does

- Creates custom React hooks with proper TypeScript typing
- Implements common hook patterns (useState, useEffect, useContext, etc.)
- Provides optimized hook implementations with proper dependencies
- Generates unit tests for custom hooks
- Follows React hooks best practices and conventions

## Examples

### Creating a Custom Hook

```typescript
// Custom hook for API data fetching
const useApiData = <T>(url: string) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
};
```

### Using Context Hook

```typescript
// Context hook for theme management
const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
```

## Best Practices

- Always include proper TypeScript types for hooks
- Use proper dependency arrays in useEffect
- Create custom hooks for reusable logic
- Follow naming conventions (use prefix)
- Add proper error handling
- Include comprehensive tests