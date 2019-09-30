import { useRef, useEffect } from 'react';
import { Contract } from 'ethers';

const useEventListener = (eventName: string, handler: (...args: any[]) => void, element: Contract) => {
  const savedHandler = useRef<typeof handler>();

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(
    () => {
      const isSupported = element && element.addListener;
      if (!isSupported) return;

      const eventListener = (...args: any[]) => savedHandler.current(...args);
      element.addListener(eventName, eventListener);
      return () => {
        element.removeListener(eventName, eventListener);
      };
    },
    [eventName, element]
  );
};

export default useEventListener;