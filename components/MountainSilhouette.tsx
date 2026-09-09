export default function MountainSilhouette() {
  return (
    <svg
      viewBox="0 0 1200 300"
      preserveAspectRatio="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <polygon
        points="0,300 0,180 120,220 240,120 360,190 480,90 600,170 720,60 840,150 960,100 1080,190 1200,140 1200,300"
        fill="#DCE7F0"
      />
      <polygon
        points="0,300 0,220 150,250 300,170 450,230 600,150 750,210 900,160 1050,220 1200,180 1200,300"
        fill="#9FB9CC"
      />
      <polygon
        points="0,300 0,260 180,270 360,220 540,260 720,210 900,250 1080,225 1200,250 1200,300"
        fill="var(--color-lapis)"
      />
    </svg>
  );
}
