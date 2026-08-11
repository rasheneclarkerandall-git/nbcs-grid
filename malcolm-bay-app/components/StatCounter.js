"use client";

import { useEffect, useRef, useState } from "react";

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

export default function StatCounter({ value, duration = 1600, formatter }) {
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const start = performance.now();
    let raf;
    function tick(now) {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      setDisplay(Math.round(easeOutCubic(t) * value));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{formatter ? formatter(display) : display.toLocaleString("en-US")}</>;
}
