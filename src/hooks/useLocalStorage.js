import { useState, useEffect } from 'react';

// A custom hook that works like useState, but reads its starting
// value from localStorage and saves back to localStorage every time
// it changes. This is how StudySync remembers your tasks and nudges
// after you refresh the page, without needing a real backend.
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const saved = window.localStorage.getItem(key);
    return saved ? JSON.parse(saved) : initialValue;
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

export default useLocalStorage;
