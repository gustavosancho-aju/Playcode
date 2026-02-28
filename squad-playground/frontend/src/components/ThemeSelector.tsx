import { useState } from 'react';
import { LANDING_THEMES } from 'shared/types';
import type { LandingTheme } from 'shared/types';

interface ThemeSelectorProps {
  onSelect: (themeId: string) => void;
}

export function ThemeSelector({ onSelect }: ThemeSelectorProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleConfirm = () => {
    if (selected) onSelect(selected);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div
        className="w-full max-w-5xl rounded-2xl p-6 shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(15,15,30,0.98), rgba(10,10,20,0.98))',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="font-display text-xl font-bold text-white tracking-wide">
            Escolha o Layout da Landing Page
          </h2>
          <p className="text-gray-500 text-xs mt-1 font-display">
            Selecione o tema visual antes de gerar a apresentação
          </p>
        </div>

        {/* Theme Cards */}
        <div className="grid grid-cols-5 gap-3">
          {LANDING_THEMES.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              isSelected={selected === theme.id}
              isHovered={hoveredId === theme.id}
              onSelect={() => setSelected(theme.id)}
              onHover={() => setHoveredId(theme.id)}
              onLeave={() => setHoveredId(null)}
            />
          ))}
        </div>

        {/* Confirm */}
        <div className="flex justify-center mt-6">
          <button
            onClick={handleConfirm}
            disabled={!selected}
            className="px-8 py-2.5 rounded-xl font-display text-sm font-semibold transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: selected
                ? `linear-gradient(135deg, ${LANDING_THEMES.find(t => t.id === selected)?.colors.primary}22, ${LANDING_THEMES.find(t => t.id === selected)?.colors.primary}11)`
                : 'rgba(255,255,255,0.03)',
              border: `1px solid ${selected ? LANDING_THEMES.find(t => t.id === selected)?.colors.primary + '66' : 'rgba(255,255,255,0.1)'}`,
              color: selected ? LANDING_THEMES.find(t => t.id === selected)?.colors.primary : '#666',
              boxShadow: selected ? `0 0 20px ${LANDING_THEMES.find(t => t.id === selected)?.colors.primary}15` : 'none',
            }}
          >
            Confirmar Tema
          </button>
        </div>
      </div>
    </div>
  );
}

function ThemeCard({
  theme,
  isSelected,
  isHovered,
  onSelect,
  onHover,
  onLeave,
}: {
  theme: LandingTheme;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onHover: () => void;
  onLeave: () => void;
}) {
  const { colors } = theme;
  const active = isSelected || isHovered;

  return (
    <button
      onClick={onSelect}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className="text-left rounded-xl p-3 transition-all duration-300 group"
      style={{
        background: isSelected
          ? `linear-gradient(135deg, ${colors.primary}15, ${colors.primary}08)`
          : 'rgba(255,255,255,0.02)',
        border: `1.5px solid ${isSelected ? colors.primary + '88' : active ? colors.primary + '44' : 'rgba(255,255,255,0.06)'}`,
        boxShadow: isSelected ? `0 0 24px ${colors.primary}20, inset 0 0 20px ${colors.primary}08` : 'none',
        transform: active ? 'translateY(-2px)' : 'none',
      }}
    >
      {/* Color Preview */}
      <div className="rounded-lg overflow-hidden mb-3 h-20 relative" style={{ background: colors.bgDark }}>
        {/* Mini layout preview */}
        <div className="absolute inset-0 p-2 flex flex-col gap-1">
          {/* Nav bar */}
          <div className="flex items-center gap-1">
            <div className="w-3 h-1 rounded-full" style={{ background: colors.primary, opacity: 0.8 }} />
            <div className="flex-1" />
            <div className="w-2 h-0.5 rounded-full bg-white/20" />
            <div className="w-2 h-0.5 rounded-full bg-white/20" />
          </div>
          {/* Hero */}
          <div className="flex-1 flex flex-col items-center justify-center gap-1">
            <div className="w-16 h-1.5 rounded-full" style={{ background: colors.textLight, opacity: 0.6 }} />
            <div className="w-10 h-1 rounded-full" style={{ background: colors.textLight, opacity: 0.3 }} />
            <div
              className="w-8 h-2 rounded mt-1"
              style={{ background: colors.primary, opacity: 0.8 }}
            />
          </div>
          {/* Cards */}
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex-1 h-3 rounded-sm"
                style={{ background: colors.primary, opacity: 0.1 + i * 0.05 }}
              />
            ))}
          </div>
        </div>
        {/* Accent strip */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: colors.primary, opacity: 0.6 }} />
      </div>

      {/* Theme Name */}
      <h3
        className="font-display text-xs font-bold tracking-wide mb-1 transition-colors duration-300"
        style={{ color: active ? colors.primary : '#ccc' }}
      >
        {theme.name}
      </h3>

      {/* Description */}
      <p className="text-[10px] leading-tight text-gray-500 mb-2 line-clamp-2">
        {theme.description}
      </p>

      {/* Font preview */}
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] text-gray-600 font-display">Fonte:</span>
        <span className="text-[9px] text-gray-400">{theme.font}</span>
      </div>

      {/* Color swatches */}
      <div className="flex gap-1 mt-2">
        {[colors.primary, colors.primaryDark, colors.bgDark, colors.accent].map((c, i) => (
          <div
            key={i}
            className="w-4 h-4 rounded-full border border-white/10"
            style={{ background: c }}
          />
        ))}
      </div>
    </button>
  );
}
