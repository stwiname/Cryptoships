
import { useRef, useEffect } from 'react';

const useEventListener = (eventName: string, handler: (...args: any[]) => void, element: any) => {
  const savedHandler = useRef<typeof handler>();

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(
    () => {
      const isSupported = element && element.addEventListener;
      if (!isSupported) return;

      const eventListener = (...args: any[]) => savedHandler.current(...args);
      element.addEventListener(eventName, eventListener);
      return () => {
        element.removeEventListener(eventName, eventListener);
      };
    },
    [eventName, element]
  );
};

export default useEventListener;