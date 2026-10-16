'use client'

// src/components/social/SideSocialHandler.tsx

import React, { useEffect, useRef, useState, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type OpenButton = 'wa' | 'chat' | null;

interface SideSocialHandlerProps {
  whatsappLink?:   string;
  chatPluginName?: string;
  className?:      string;
}

interface ChatPlugin {
  openBot: () => void;
}

declare global {
  interface Window {
    [key: string]: ChatPlugin | unknown;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INLINE SVG ICONS  (slightly smaller viewBox content)
// ─────────────────────────────────────────────────────────────────────────────

const WhatsAppIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"
      fill="#fff"
    />
    <path
      d="M12.04 2C6.466 2 1.94 6.526 1.94 12.099c0 1.79.47 3.545 1.36 5.089L2 22l4.979-1.305a10.095 10.095 0 0 0 5.061 1.361h.005C17.617 22.056 22 17.53 22 11.957 22 9.26 20.968 6.724 19.072 4.828A10.024 10.024 0 0 0 12.04 2zm0 18.382a8.375 8.375 0 0 1-4.273-1.173l-.306-.182-3.172.832.847-3.09-.2-.317a8.336 8.336 0 0 1-1.279-4.453c0-4.612 3.753-8.365 8.37-8.365 2.235 0 4.334.872 5.914 2.453a8.316 8.316 0 0 1 2.453 5.913c-.003 4.613-3.756 8.382-8.354 8.382z"
      fill="#fff"
    />
  </svg>
);

const handleCall = () => {
  // Directly open phone dialer with the number
  window.location.href = "tel:+918888314542";
};
const CallIcon: React.FC = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────────────────────

const STYLES = `
  /* ─────────────────────────────────────────────────────────────────
     KEYFRAMES
  ───────────────────────────────────────────────────────────────── */

  /* Entrance: slides in from right edge with a soft spring bounce */
  @keyframes ssh-enter {
    0%   { opacity: 0;   transform: translateX(110%); }
    55%  { opacity: 1;   transform: translateX(-5px); }
    75%  { transform: translateX(2px);  }
    100% { transform: translateX(0px);  }
  }

  /* Icon micro-bounce when pill opens */
  @keyframes ssh-icon-bounce {
    0%   { transform: scale(1);    }
    40%  { transform: scale(1.18); }
    70%  { transform: scale(0.93); }
    100% { transform: scale(1);    }
  }

  /* Text character shimmer on open */
  @keyframes ssh-text-in {
    0%   { opacity: 0; transform: translateX(10px); }
    100% { opacity: 1; transform: translateX(0);    }
  }

  /* ─────────────────────────────────────────────────────────────────
     WIDGET WRAPPER
     right: 0  → buttons are glued to the right viewport edge
     align-items: flex-end → buttons are right-aligned, expand leftward
  ───────────────────────────────────────────────────────────────── */
  .ssh-widget {
    position:       fixed;
    right:          0;
    bottom:         130px;
    z-index:        9999;
    display:        flex;
    flex-direction: column;
    align-items:    flex-end;
    gap:            12px;
    pointer-events: none; /* children re-enable */
  }

  /* ─────────────────────────────────────────────────────────────────
     PILL / TAB BUTTON
     Shape:
       [ 🟢 icon ][ label text ]→ right edge (straight)
       └── left rounded ──────┘└── 0 radius ──┘

     border-radius: 28px 0 0 28px
       top-left=28  top-right=0  bottom-right=0  bottom-left=28
  ───────────────────────────────────────────────────────────────── */
  .ssh-btn {
    pointer-events:  all;
    display:         flex;
    align-items:     center;
    flex-direction:  row;        /* icon LEFT → label RIGHT */
    background:      #ffffff;
    border:          none;
    cursor:          pointer;
    text-decoration: none;
    color:           inherit;
    overflow:        hidden;

    /* Rounded left side only, right is flush with edge */
    border-radius: 28px 0 0 28px;

    /* Collapsed: pill is just the icon circle (44px wide) */
    height: 44px;
    width:  44px;

    /* Shadow casts leftward only (no right shadow — flush edge) */
    box-shadow:
      -3px 2px 14px rgba(0,0,0,0.13),
      -1px 1px 4px  rgba(0,0,0,0.07);

    /* Staggered entrance */
    animation: ssh-enter 0.46s cubic-bezier(0.34,1.2,0.64,1) both;

    /* Expansion grows leftward */
    transition:
      width      0.32s cubic-bezier(0.4, 0, 0.2, 1),
      box-shadow 0.22s ease,
      transform  0.14s ease;

    will-change: width;
  }

  .ssh-btn:nth-child(1) { animation-delay: 0.08s; }
  .ssh-btn:nth-child(2) { animation-delay: 0.22s; }

  /* ── Expanded ─────────────────────────────────────────── */
  .ssh-btn.is-open {
    width: 172px;
    box-shadow:
      -5px 3px 20px rgba(0,0,0,0.15),
      -2px 1px 7px  rgba(0,0,0,0.09);
  }

  /* Press feedback */
  .ssh-btn:active {
    transform: scale(0.95) translateX(2px);
  }

  /* Keyboard focus ring */
  .ssh-btn:focus-visible {
    outline:        2px solid #4f7cff;
    outline-offset: 3px;
  }

  /* ─────────────────────────────────────────────────────────────────
     ICON CIRCLE
     • order: 1  → LEFT side of the row (before the label)
     • Smaller: 34×34px inside a 44px tall pill
     • Left margin gives a small gap from pill left edge
  ───────────────────────────────────────────────────────────────── */
  .ssh-icon {
    order:           1;           /* LEFT — comes before label */
    flex-shrink:     0;
    width:           30px;
    min-width:       30px;
    height:          30px;
    border-radius:   50%;
    display:         flex;
    align-items:     center;
    justify-content: center;
    margin-left:     5px;         /* small inset from pill left edge */
    transition:      transform 0.7s cubic-bezier(0.34,1.4,0.64,1);
  }

  /* Icon bounce when pill opens */
  .ssh-btn.is-open .ssh-icon {
    animation: ssh-icon-bounce 0.32s cubic-bezier(0.34,1.4,0.64,1) both;
  }

  .ssh-icon-wa   { background: #25d366; }
  .ssh-icon-chat { background: #4f7cff; }

  /* ─────────────────────────────────────────────────────────────────
     LABEL TEXT
     • order: 2  → RIGHT side (after icon)
     • Expands rightward as pill widens
     • Fades + slides in with a tiny delay after width starts
  ───────────────────────────────────────────────────────────────── */
  .ssh-label {
    order:          2;            /* RIGHT — after icon */
    font-family:    inherit;
    font-size:      13px;
    font-weight:    600;
    letter-spacing: 0em;
    white-space:    nowrap;
    overflow:       hidden;

    /* Collapsed */
    max-width:     0;
    opacity:       0;
    padding-left:  0;
    padding-right: 0;

    transition:
      max-width     0.32s cubic-bezier(0.4, 0, 0.2, 1),
      opacity       0.22s ease 0.1s,       /* slight delay — appears after pill opens */
      padding-left  0.22s ease,
      padding-right 0.22s ease;
  }

  /* Expanded */
  .ssh-btn.is-open .ssh-label {
    max-width:     110px;
    opacity:       1;
    padding-left:  10px;
    padding-right: 12px;
    animation:     ssh-text-in 0.22s ease 0.12s both;
  }

  .ssh-label-wa   { color: #15803d; }
  .ssh-label-chat { color: #2563eb; }

  /* ─────────────────────────────────────────────────────────────────
     MOBILE
     Always collapsed — icon tab on edge, tap = immediate action
  ───────────────────────────────────────────────────────────────── */
  @media (max-width: 640px) {
    .ssh-widget { right: 10px; bottom: 16px; gap: 10px; }

    .ssh-btn,
    .ssh-btn.is-open {
      width:  44px !important;
      height: 44px !important;
    }
    .ssh-label      { display: none !important; }
    .ssh-icon       { margin-left: 5px; }
  }

  /* ─────────────────────────────────────────────────────────────────
     REDUCED MOTION
  ───────────────────────────────────────────────────────────────── */
  @media (prefers-reduced-motion: reduce) {
    .ssh-btn,
    .ssh-icon,
    .ssh-label {
      animation:  none !important;
      transition: none !important;
    }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// HOOK — inject CSS once, idempotent
// ─────────────────────────────────────────────────────────────────────────────

function useInjectStyles(css: string, id: string): void {
  useEffect(() => {
    if (document.getElementById(id)) return;
    const tag       = document.createElement('style');
    tag.id          = id;
    tag.textContent = css;
    document.head.appendChild(tag);
    // global style — intentionally NOT removed on unmount
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const SideSocialHandler: React.FC<SideSocialHandlerProps> = ({
  whatsappLink   = 'https://wa.link/n1cs15',
  className      = '',
}) => {
  useInjectStyles(STYLES, 'ssh-global-styles');

  /**
   * SINGLE shared state — only ONE pill can be open at any time.
   *   null   →  both collapsed  (icon-tab only visible on edge)
   *  'wa'    →  WhatsApp expanded, Chat auto-collapsed
   *  'chat'  →  Chat expanded,     WhatsApp auto-collapsed
   *
   * Because openBtn holds exactly one value, mutual exclusion
   * is structurally guaranteed — no extra logic needed.
   */
  const [openBtn, setOpenBtn] = useState<OpenButton>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Collapse both when mouse exits the whole widget group
  const handleWidgetLeave = useCallback(() => setOpenBtn(null), []);

  return (
    <div
      ref={widgetRef}
      className={`ssh-widget${className ? ` ${className}` : ''}`}
      role="complementary"
      aria-label="Quick contact options"
      onMouseLeave={handleWidgetLeave}
    >

      {/* ── WhatsApp pill ─────────────────────────────────────────────────
          Layout inside pill (left → right):
            [  🟢 icon (order:1)  ][  Chat With Us (order:2)  ]→ screen edge

          Collapsed: only the 34px icon circle is visible (44px wide pill)
          Expanded:  label fades in to the right of the icon
      ──────────────────────────────────────────────────────────────────── */}
      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className={`ssh-btn${openBtn === 'wa' ? ' is-open' : ''}`}
        aria-label="Chat with us on WhatsApp"
        title="Chat with us on WhatsApp"
        onMouseEnter={() => setOpenBtn('wa')}
        onFocus={()       => setOpenBtn('wa')}
        onBlur={()        => setOpenBtn(null)}
      >
        <div className="ssh-icon ssh-icon-wa">
          <WhatsAppIcon />
        </div>
        <span className="ssh-label ssh-label-wa" aria-hidden="true">
          Chat With Us
        </span>
      </a>

      {/* ── Chat Support pill ─────────────────────────────────────────────
          Same layout: icon LEFT → label RIGHT → screen edge (flush)
      ──────────────────────────────────────────────────────────────────── */}
      <button
        type="button"
        className={`ssh-btn${openBtn === 'chat' ? ' is-open' : ''}`}
        aria-label="Call Ajit Jain for support"
        title="Call Ajit Jain - +91 88883 14542"
        onClick={handleCall}
        onMouseEnter={() => setOpenBtn('chat')}
        onFocus={() => setOpenBtn('chat')}
        onBlur={() => setOpenBtn(null)}
    >
      <div className="ssh-icon ssh-icon-chat">
        <CallIcon />
      </div>
      <span className="ssh-label ssh-label-chat" aria-hidden="true">
        Call Support
      </span>
    </button>
  

    </div>
  );
};

export default SideSocialHandler;