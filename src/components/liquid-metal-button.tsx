// Source: https://21st.dev/community/components/s/button?preview=%2F%40johuniq%2Fcomponents%2Fliquid-metal-button
// Changes from the original:
//  - `isHovered` is read through a ref inside the click timeout (the original
//    captured a stale value, so the shader speed could reset wrongly).
//  - Cleanup called `destroy()`, which doesn't exist on ShaderMount — the
//    method is `dispose()`. The WebGL context was never freed.
//  - The shader is mounted only while the button is near the viewport, so
//    24 buttons on one page don't exceed the browser's WebGL context limit.
//  - Hover (or keyboard focus): the button scales up 8%, the pill turns dark
//    grey and the label brightens.
//  - Added `className` and keyboard focus ring; `type="button"`.

import { liquidMetalFragmentShader, ShaderMount } from "@paper-design/shaders";
import { Sparkles } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";

interface LiquidMetalButtonProps {
  label?: string;
  onClick?: () => void;
  viewMode?: "text" | "icon";
  className?: string;
}

const SPRING = "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease";

export function LiquidMetalButton({
  label = "Get Started",
  onClick,
  viewMode = "text",
  className = "",
}: LiquidMetalButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const shaderRef = useRef<HTMLDivElement>(null);
  const shaderMount = useRef<ShaderMount | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleId = useRef(0);
  const hoveredRef = useRef(false);

  const dimensions = useMemo(() => {
    if (viewMode === "icon") {
      return { width: 46, height: 46, innerWidth: 42, innerHeight: 42, shaderWidth: 46, shaderHeight: 46 };
    }
    return { width: 142, height: 46, innerWidth: 138, innerHeight: 42, shaderWidth: 142, shaderHeight: 46 };
  }, [viewMode]);

  useEffect(() => {
    const styleId = "shader-canvas-style-exploded";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        .shader-container-exploded canvas {
          width: 100% !important;
          height: 100% !important;
          display: block !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          border-radius: 100px !important;
        }
        @keyframes ripple-animation {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(4); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    // Browsers cap live WebGL contexts (~16 in Chrome). A page can hold 24 of
    // these buttons, so the shader only runs while the button is near the viewport.
    const el = shaderRef.current;
    if (!el) return;

    const mount = () => {
      if (shaderMount.current) return;
      try {
        shaderMount.current = new ShaderMount(
          el,
          liquidMetalFragmentShader,
          {
            u_repetition: 4,
            u_softness: 0.5,
            u_shiftRed: 0.3,
            u_shiftBlue: 0.3,
            u_distortion: 0,
            u_contour: 0,
            u_angle: 45,
            u_scale: 8,
            u_shape: 1,
            u_offsetX: 0.1,
            u_offsetY: -0.1,
          },
          undefined,
          hoveredRef.current ? 1 : 0.6,
        );
      } catch (error) {
        console.error("Failed to load liquid metal shader:", error);
      }
    };
    const unmount = () => {
      shaderMount.current?.dispose();
      shaderMount.current = null;
      el.querySelectorAll("canvas").forEach((c) => c.remove());
    };

    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? mount() : unmount()),
      { rootMargin: "200px" },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      unmount();
    };
  }, []);

  const handleMouseEnter = () => {
    hoveredRef.current = true;
    setIsHovered(true);
    shaderMount.current?.setSpeed(1);
  };

  const handleMouseLeave = () => {
    hoveredRef.current = false;
    setIsHovered(false);
    setIsPressed(false);
    shaderMount.current?.setSpeed(0.6);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (shaderMount.current) {
      shaderMount.current.setSpeed(2.4);
      setTimeout(() => {
        shaderMount.current?.setSpeed(hoveredRef.current ? 1 : 0.6);
      }, 300);
    }

    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      // keyboard clicks report 0,0 — ripple from the centre instead
      const x = e.clientX ? e.clientX - rect.left : rect.width / 2;
      const y = e.clientY ? e.clientY - rect.top : rect.height / 2;
      const ripple = { x, y, id: rippleId.current++ };
      setRipples((prev) => [...prev, ripple]);
      setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== ripple.id)), 600);
    }

    onClick?.();
  };

  const layer = (z: number, extra?: React.CSSProperties): React.CSSProperties => ({
    position: "absolute",
    top: 0,
    left: 0,
    width: `${dimensions.width}px`,
    height: `${dimensions.height}px`,
    transformStyle: "preserve-3d",
    transition: SPRING,
    zIndex: z,
    ...extra,
  });
  const pressTransform = isPressed ? "translateY(1px) scale(0.98)" : "translateY(0) scale(1)";

  return (
    <div className={`relative inline-block ${className}`}>
      <div style={{ perspective: "1000px", perspectiveOrigin: "50% 50%" }}>
        <div
          style={{
            position: "relative",
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            transformStyle: "preserve-3d",
            transition: SPRING,
            transform: isHovered ? "scale(1.08)" : "scale(1)",
          }}
        >
          {/* label */}
          <div
            style={layer(30, {
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transform: "translateZ(20px)",
              pointerEvents: "none",
            })}
          >
            {viewMode === "icon" && (
              <Sparkles size={16} style={{ color: "#666666", filter: "drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.5))" }} />
            )}
            {viewMode === "text" && (
              <span
                style={{
                  fontSize: "14px",
                  color: isHovered ? "#e5e5e5" : "#666666",
                  fontWeight: 400,
                  textShadow: "0px 1px 2px rgba(0, 0, 0, 0.5)",
                  whiteSpace: "nowrap",
                  transition: "color 0.25s ease",
                }}
              >
                {label}
              </span>
            )}
          </div>

          {/* dark inner pill */}
          <div style={layer(20, { transform: `translateZ(10px) ${pressTransform}` })}>
            <div
              style={{
                width: `${dimensions.innerWidth}px`,
                height: `${dimensions.innerHeight}px`,
                margin: "2px",
                borderRadius: "100px",
                background: "linear-gradient(180deg, #202020 0%, #000000 100%)",
                boxShadow: isPressed
                  ? "inset 0px 2px 4px rgba(0, 0, 0, 0.4), inset 0px 1px 2px rgba(0, 0, 0, 0.3)"
                  : "none",
                transition: `${SPRING}, box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1)`,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* gradients can't be transitioned, so the hover colour is a layer that fades in */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "100px",
                  background: "linear-gradient(180deg, #4a4a4a 0%, #2e2e2e 100%)",
                  opacity: isHovered ? 1 : 0,
                  transition: "opacity 0.25s ease",
                }}
              />
            </div>
          </div>

          {/* liquid metal rim */}
          <div style={layer(10, { transform: `translateZ(0px) ${pressTransform}` })}>
            <div
              style={{
                height: `${dimensions.height}px`,
                width: `${dimensions.width}px`,
                borderRadius: "100px",
                boxShadow: isPressed
                  ? "0px 0px 0px 1px rgba(0, 0, 0, 0.5), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)"
                  : isHovered
                    ? "0px 0px 0px 1px rgba(0, 0, 0, 0.4), 0px 12px 6px 0px rgba(0, 0, 0, 0.05), 0px 8px 5px 0px rgba(0, 0, 0, 0.1), 0px 4px 4px 0px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.2)"
                    : "0px 0px 0px 1px rgba(0, 0, 0, 0.3), 0px 36px 14px 0px rgba(0, 0, 0, 0.02), 0px 20px 12px 0px rgba(0, 0, 0, 0.08), 0px 9px 9px 0px rgba(0, 0, 0, 0.12), 0px 2px 5px 0px rgba(0, 0, 0, 0.15)",
                transition: `${SPRING}, box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1)`,
                background: "rgb(0 0 0 / 0)",
              }}
            >
              <div
                ref={shaderRef}
                className="shader-container-exploded"
                style={{
                  borderRadius: "100px",
                  overflow: "hidden",
                  position: "relative",
                  width: `${dimensions.shaderWidth}px`,
                  maxWidth: `${dimensions.shaderWidth}px`,
                  height: `${dimensions.shaderHeight}px`,
                  transition: "width 0.4s ease, height 0.4s ease",
                }}
              />
            </div>
          </div>

          <button
            ref={buttonRef}
            type="button"
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onFocus={(e) => e.currentTarget.matches(":focus-visible") && handleMouseEnter()}
            onBlur={handleMouseLeave}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
            style={layer(40, {
              background: "transparent",
              border: "none",
              cursor: "pointer",
              transform: "translateZ(25px)",
              overflow: "hidden",
              borderRadius: "100px",
            })}
            aria-label={label}
          >
            {ripples.map((ripple) => (
              <span
                key={ripple.id}
                style={{
                  position: "absolute",
                  left: `${ripple.x}px`,
                  top: `${ripple.y}px`,
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 70%)",
                  pointerEvents: "none",
                  animation: "ripple-animation 0.6s ease-out",
                }}
              />
            ))}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LiquidMetalButton;
