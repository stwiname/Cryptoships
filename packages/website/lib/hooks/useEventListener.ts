import { Contract } from 'ethers';
import { useEffect, useRef } from 'react';

// TODO support cancellation of handler
const useEventListener = <C extends Contract>(
  element: C,
  eventName: Extract<keyof C['interface']['events'], string>,
  handler: (...args: any[]) => void,
) => {
  const savedHandler = useRef<typeof handler>();

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const isSupported = element && element.addListener;
    if (!isSupported) {
      return;
    }

    const eventListener = (...args: any[]) => savedHandler.current(...args);
    element.addListener(eventName, eventListener);
    return () => {
      element.removeListener(eventName, eventListener);
    };
  }, [eventName, element]);
};

export default useEventListener;
