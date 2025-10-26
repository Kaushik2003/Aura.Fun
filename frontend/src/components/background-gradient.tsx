export function BackgroundGradient() {
  return (
    <div className="absolute bottom-0 z-0 h-full w-full rotate-180">
      <div className="pointer-events-none absolute inset-0 z-10 h-full w-full" style={{ opacity: 1 }}>
        <div className="pointer-events-none absolute top-0 left-0 z-0 h-full w-full" style={{ transform: "translateX(29.9694px)" }}>
          <div
            className="absolute top-0 left-0"
            style={{
              transform: "translateY(-350px) rotate(-45deg)",
              background: "radial-gradient(68.54% 68.72% at 55.02% 31.46%, rgba(255, 0, 102, 0.1) 0px, rgba(255, 26, 98, 0.02) 50%, rgba(230, 0, 92, 0) 80%)",
              width: "560px",
              height: "1380px"
            }}
          />
          <div
            className="absolute top-0 left-0 origin-top-left"
            style={{
              transform: "rotate(-45deg) translate(5%, -50%)",
              background: "radial-gradient(50% 50%, rgba(255, 179, 213, 0.06) 0px, rgba(255, 26, 121, 0.02) 80%, transparent 100%)",
              width: "240px",
              height: "1380px"
            }}
          />
          <div
            className="absolute top-0 left-0 origin-top-left"
            style={{
              transform: "rotate(-45deg) translate(-180%, -70%)",
              background: "radial-gradient(50% 50%, rgba(255, 179, 214, 0.04) 0px, rgba(255, 179, 221, 0.04) 80%, transparent 100%)",
              width: "240px",
              height: "1380px"
            }}
          />
        </div>
        <div className="pointer-events-none absolute top-0 right-0 z-40 h-full w-full" style={{ transform: "translateX(-29.9694px)" }}>
          <div
            className="absolute top-0 right-0"
            style={{
              transform: "translateY(-350px) rotate(45deg)",
              background: "radial-gradient(68.54% 68.72% at 55.02% 31.46%, rgba(255, 0, 102, 0.1) 0px, rgba(255, 26, 98, 0.02) 50%, rgba(230, 0, 92, 0) 80%)",
              width: "560px",
              height: "1380px"
            }}
          />
          <div
            className="absolute top-0 right-0 origin-top-right"
            style={{
              transform: "rotate(45deg) translate(-5%, -50%)",
              background: "radial-gradient(50% 50%, rgba(255, 179, 213, 0.06) 0px, rgba(255, 26, 121, 0.02) 80%, transparent 100%)",
              width: "240px",
              height: "1380px"
            }}
          />
          <div
            className="absolute top-0 right-0 origin-top-right"
            style={{
              transform: "rotate(45deg) translate(180%, -70%)",
              background: "radial-gradient(50% 50%, rgba(255, 179, 214, 0.04) 0px, rgba(255, 179, 221, 0.04) 80%, transparent 100%)",
              width: "240px",
              height: "1380px"
            }}
          />
        </div>
      </div>
    </div>
  )
}
