export default function WaveBackground() {
  return (
    <div className="wave-backdrop" aria-hidden="true">
      <svg className="wave-1" viewBox="0 0 2880 320" preserveAspectRatio="none">
        <path
          fill="#0989a6"
          d="M0,160 C240,220 480,100 720,140 C960,180 1200,260 1440,220 C1680,180 1920,80 2160,120 C2400,160 2640,240 2880,200 L2880,320 L0,320 Z"
        />
      </svg>
      <svg className="wave-2" viewBox="0 0 2880 320" preserveAspectRatio="none">
        <path
          fill="#14adbd"
          d="M0,200 C300,140 600,240 900,200 C1200,160 1500,100 1800,140 C2100,180 2400,240 2880,180 L2880,320 L0,320 Z"
        />
      </svg>
      <svg className="wave-3" viewBox="0 0 2880 320" preserveAspectRatio="none">
        <path
          fill="#013d73"
          d="M0,240 C360,200 720,280 1080,240 C1440,200 1800,160 2160,200 C2400,224 2640,260 2880,230 L2880,320 L0,320 Z"
        />
      </svg>
    </div>
  );
}
