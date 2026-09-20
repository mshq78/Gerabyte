import React, { useState } from 'react';
import { DESIGN_PERSONAS, type DesignPersonaId } from './personas';
import { getPersona, setPersona } from './transport';

/**
 * The persona switcher, and the only piece of design mode a designer touches.
 *
 * Switching reloads the page: every screen loads its data in a mount effect,
 * so a reload is both the simplest and the most faithful way to land in the
 * new persona's state.
 */
export const DesignBar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const active = getPersona();

  const choose = (id: DesignPersonaId) => {
    setPersona(id);
    window.location.reload();
  };

  return (
    <div
      dir="rtl"
      style={{
        position: 'fixed',
        insetInlineStart: 16,
        bottom: 16,
        zIndex: 2147483000,
        fontFamily: 'inherit',
      }}
    >
      {open && (
        <div
          style={{
            marginBottom: 8,
            background: '#111827',
            color: '#f9fafb',
            borderRadius: 12,
            padding: 8,
            width: 280,
            boxShadow: '0 10px 30px rgba(0,0,0,.35)',
          }}
        >
          <p style={{ fontSize: 14, opacity: 0.75, margin: '4px 8px 8px' }}>
            حالت طراحی — داده‌ها ساختگی است
          </p>
          {DESIGN_PERSONAS.map((persona) => (
            <button
              key={persona.id}
              type="button"
              onClick={() => choose(persona.id)}
              style={{
                display: 'block',
                width: '100%',
                minHeight: 44,
                textAlign: 'start',
                padding: '8px 10px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                background: persona.id === active ? '#2563eb' : 'transparent',
                color: 'inherit',
                fontSize: 14,
              }}
            >
              <span style={{ fontWeight: 700 }}>{persona.label}</span>
              <span style={{ display: 'block', fontSize: 14, opacity: 0.7 }}>
                {persona.description}
              </span>
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          minHeight: 44,
          minWidth: 44,
          padding: '0 14px',
          borderRadius: 999,
          border: 'none',
          cursor: 'pointer',
          background: '#111827',
          color: '#f9fafb',
          fontSize: 14,
          fontWeight: 700,
          boxShadow: '0 6px 20px rgba(0,0,0,.3)',
        }}
      >
        حالت طراحی
      </button>
    </div>
  );
};
