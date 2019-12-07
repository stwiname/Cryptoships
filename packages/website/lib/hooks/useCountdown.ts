import { useEffect, useState } from 'react';

type Options = {
  intervalTime?: number;
  now?: () => Date;
};

function useCountdown(date: Date, options: Options = {}) {
  const { intervalTime = 1000, now = () => new Date() } = options;

  const calculateTimeRemaining = (): number => date ? date.getTime() - now().getTime() : 0;

  const [timeLeft, setTimeLeft] = useState<number>(
    calculateTimeRemaining()
  );

  useEffect(() => {

    const interval = setInterval(() => {

      const newTime = calculateTimeRemaining();

      if (newTime < 0) {
        clearInterval(interval);
      }
      setTimeLeft(Math.max(newTime, 0));
    }, intervalTime);

    return () => clearInterval(interval);
  }, [intervalTime, date, now]);

  return timeLeft;
}

export default useCountdown;
