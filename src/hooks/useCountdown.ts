import { useEffect, useState } from 'react';

type Options = {
  intervalTime?: number;
  now?: () => Date;
};

function useCountdown(date: () => Date, options: Options = {}) {
  const { intervalTime = 1000, now = () => Date.now() } = options;
  const [timeLeft, setTimeLeft] = useState(
    () => new Date(date()).getTime() - new Date(now()).getTime()
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(current => {
        if (current <= 0) {
          clearInterval(interval);

          return 0;
        }

        return current - intervalTime;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [intervalTime]);

  return timeLeft;
}

export default useCountdown;
