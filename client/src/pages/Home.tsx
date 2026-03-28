import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { HexColorPicker } from 'react-colorful';
import axios from 'axios';
import { hexToHsl, hslToHex, getMonochromaticVariations, getAnalogousVariations, getComplementaryVariations, getTriadicVariations, getSplitComplementaryVariations, hslToRgb, parseAnyColorToHex } from '../utils/colorUtils';

// --- Sub-componente: Input de texto para colores ---
const ColorTextInput = ({ colorHex, format, onChange, formatColorString }: { colorHex: string, format: string, onChange: (c: string) => void, formatColorString: (h: number, s: number, l: number, format: string) => string }) => {

  const [h, s, l] = hexToHsl(colorHex);
  const formatted = formatColorString(h, s, l, format);

  const [localValue, setLocalValue] = useState(formatted);

  useEffect(() => {

    setLocalValue(formatted);

  }, [formatted]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    setLocalValue(e.target.value);
    const parsed = parseAnyColorToHex(e.target.value);
    if (parsed) {

      onChange(parsed);

    }

  };

  const handleBlur = () => {

    const parsed = parseAnyColorToHex(localValue);
    if (!parsed) {

      setLocalValue(formatted);

    }

  };

  return (
    <input
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      style={{
        fontSize: '1.2rem',
        fontWeight: 'bold',
        fontFamily: 'monospace',
        color: 'var(--text-primary)',
        background: 'transparent',
        border: 'none',
        borderBottom: '2px solid rgba(255,255,255,0.2)',
        textAlign: 'center',
        width: '180px',
        outline: 'none',
        padding: '0.4rem',
        transition: 'border-color 0.3s'
      }}
      onFocus={(e) => e.target.style.borderColor = 'var(--text-primary)'}
    />
  );

};

// --- Sub-componente: Custom Select ---
const CustomSelect = ({ value, options, onChange, label }: { value: string, options: { value: string, label: string }[], onChange: (v: string) => void, label: string }) => {

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', position: 'relative', width: '250px' }}>
      <label style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{label}</label>

      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '12px',
          padding: '0.8rem 1.2rem',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontWeight: '600',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
      >
        <span>{options.find(o => o.value === value)?.label}</span>
        <span style={{ transition: 'transform 0.3s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
      </div>

      {isOpen && (
        <>
          <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 900 }} />
          <div style={{
            position: 'absolute', top: '100%', left: 0, width: '100%', marginTop: '8px',
            background: 'rgba(20, 25, 30, 0.95)', border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px', overflow: 'hidden', zIndex: 901, backdropFilter: 'blur(20px)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)', animation: 'slideInY 0.2s ease-out'
          }}>
            {options.map(o => (
              <div
                key={o.value}
                onClick={() => { onChange(o.value); setIsOpen(false); }}
                style={{
                  padding: '0.8rem 1.2rem', color: value === o.value ? '#fff' : 'rgba(255,255,255,0.7)',
                  background: value === o.value ? 'rgba(167, 119, 227, 0.4)' : 'transparent',
                  cursor: 'pointer', transition: 'all 0.2s', fontWeight: value === o.value ? 'bold' : 'normal'
                }}
                onMouseEnter={(e) => { if (value !== o.value) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={(e) => { if (value !== o.value) e.currentTarget.style.background = 'transparent'; }}
              >
                {o.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

};

// --- Sub-componente: Sección de Paleta ---
const PaletteSection = ({
  baseHex,
  variationsCount,
  user,
  token,
  showToast,
  renderColorColumn
}: {
  baseHex: string,
  variationsCount: number,
  user: { role: string } | null,
  token: string | null,
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void,
  renderColorColumn: (title: string, colors: [number, number, number][]) => React.ReactElement
}) => {

  const [h, s, l] = hexToHsl(baseHex);

  const analogousColors = getAnalogousVariations(h, s, l, variationsCount);
  const monochromaticColors = getMonochromaticVariations(h, s, l, variationsCount);
  const complementaryColors = getComplementaryVariations(h, s, l, variationsCount);
  const triadicColors = getTriadicVariations(h, s, l, variationsCount);
  const splitComplementaryColors = getSplitComplementaryVariations(h, s, l, variationsCount);

  const [paletteName, setPaletteName] = useState(`Paleta Base ${baseHex.toUpperCase()}`);

  const handleSavePalette = async () => {

    if (!user || user.role === 'GUEST') {

      showToast("Debes iniciar sesión para guardar paletas.", "info");
      return;

    }

    try {

      const paletteData = {
        base: baseHex,
        analogous: analogousColors.map(c => hslToHex(c[0], c[1], c[2])),
        monochromatic: monochromaticColors.map(c => hslToHex(c[0], c[1], c[2])),
        complementary: complementaryColors.map(c => hslToHex(c[0], c[1], c[2])),
        triadic: triadicColors.map(c => hslToHex(c[0], c[1], c[2])),
        splitComplementary: splitComplementaryColors.map(c => hslToHex(c[0], c[1], c[2]))
      };

      await axios.post('http://localhost:5000/api/palettes', {
        name: paletteName,
        colors: paletteData
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      showToast('¡Paleta guardada exitosamente!', 'success');

    } catch (e) {

      console.error(e);
      showToast('Error al guardar la paleta', 'error');

    }

  };

  return (
    <div className="glass-panel" style={{ marginTop: '3rem', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Combinaciones (Base: {baseHex})</h3>

        {user && user.role !== 'GUEST' && (
          <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
            <input
              type="text"
              className="input-glass"
              style={{ width: '220px', fontSize: '0.9rem', padding: '0.6rem 1rem', border: '1px solid rgba(255,255,255,0.1)' }}
              value={paletteName}
              onChange={(e) => setPaletteName(e.target.value)}
              placeholder="Nombre de la paleta"
            />
            <button
              className="button-primary"
              style={{
                backgroundColor: '#a777e3',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 'bold',
                padding: '0.6rem 1.8rem',
                borderRadius: '8px',
                fontSize: '1rem',
                boxShadow: '0 4px 16px rgba(167, 119, 227, 0.4)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(167, 119, 227, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(167, 119, 227, 0.4)';
              }}
              onClick={handleSavePalette}
            >
              Guardar
            </button>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {renderColorColumn('Monocromática', monochromaticColors)}
        {renderColorColumn('Complementaria', complementaryColors)}
        {renderColorColumn('Análoga', analogousColors)}
        {renderColorColumn('Triada', triadicColors)}
        {renderColorColumn('Complementaria Dividida', splitComplementaryColors)}
      </div>
    </div>
  );

};

const getRandomHex = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');

export default function Home() {

  const { user, token } = useAuth();

  const [colors, setColors] = useState<string[]>(() => {

    try {
      const saved = localStorage.getItem('colors');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 2) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [getRandomHex()];

  });

  // Efecto para la persistencia inteligente
  useEffect(() => {

    if (colors.length >= 2) {
      localStorage.setItem('colors', JSON.stringify(colors));
    } else {
      localStorage.removeItem('colors');
    }

  }, [colors]);
  const [variationsCount, setVariationsCount] = useState<number>(() => {

    const saved = localStorage.getItem('variationsCount');
    const val = saved ? parseInt(saved, 10) : 6;
    return val < 6 ? 6 : val;

  });
  const [colorFormat, setColorFormat] = useState<string>('hex');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estados para gestión dentro del modal
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [editingPaletteId, setEditingPaletteId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  interface Palette {
    id: number;
    name: string;
    colors: {
      base: string;
      analogous: string[];
      monochromatic: string[];
      complementary: string[];
      triadic: string[];
      splitComplementary: string[];
    };
    createdAt: string;
  }

  const [savedPalettes, setSavedPalettes] = useState<Palette[]>([]);
  const [pickerOpenIndex, setPickerOpenIndex] = useState<number | null>(null);
  const [isScrolledPastPalette0, setIsScrolledPastPalette0] = useState(false);
  const [isMouseActive, setIsMouseActive] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const mouseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Efecto para el botón ToUp inteligente
  useEffect(() => {

    const handleScroll = () => {
      const palette0 = document.getElementById('palette-0');
      if (palette0) {
        // Mostramos el botón cuando superamos el final de la primera paleta
        setIsScrolledPastPalette0(window.scrollY > (palette0.offsetTop + palette0.offsetHeight - 100));
      } else {
        setIsScrolledPastPalette0(false);
      }
    };

    const handleMouseMove = () => {
      setIsMouseActive(true);
      if (mouseTimerRef.current) clearTimeout(mouseTimerRef.current);
      mouseTimerRef.current = setTimeout(() => {
        setIsMouseActive(false);
      }, 3000);
    };

    const handleMouseLeave = () => {
      setIsMouseActive(false);
      if (mouseTimerRef.current) clearTimeout(mouseTimerRef.current);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      if (mouseTimerRef.current) clearTimeout(mouseTimerRef.current);
    };

  }, []);

  // Efecto para cerrar el color picker al hacer clic fuera
  useEffect(() => {

    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setPickerOpenIndex(null);
      }
    };

    if (pickerOpenIndex !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };

  }, [pickerOpenIndex]);

  // --- Sistema de Toast ---
  const [toasts, setToasts] = useState<{ id: number, message: string, type: 'success' | 'error' | 'info' }[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {

    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {

      setToasts(prev => prev.filter(t => t.id !== id));

    }, 3000);

  };

  // Limites por rol
  const maxInputs = user?.role === 'GUEST' ? 1 : 10;
  const maxVariations = user?.role === 'GUEST' ? 6 : 15;
  const minVariations = 6;

  // Actualizar limites solo cuando cambie el rol de forma reactiva, evitando setState innecesarios
  useEffect(() => {

    if (user && colors.length > maxInputs) {

      setColors(prev => prev.slice(0, maxInputs));

    }

    if (user && variationsCount > maxVariations) {

      setVariationsCount(maxVariations);

    }

    if (user && variationsCount < minVariations) {

      setVariationsCount(minVariations);

    }
    // Solo reaccionar a user y max limites, no a colors/variationsCount para evitar loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, maxInputs, maxVariations, minVariations]);

  useEffect(() => {

    localStorage.setItem('variationsCount', variationsCount.toString());

  }, [variationsCount]);

  const addColor = () => {

    if (colors.length < maxInputs) {

      setColors([...colors, getRandomHex()]);

    }

  };

  const removeColor = (index: number) => {

    if (colors.length > 1) {

      setColors(prev => prev.filter((_, i) => i !== index));

    }

  };

  const handleFetchPalettes = async () => {

    if (!user || user.role === 'GUEST') return;
    try {

      const res = await axios.get('http://localhost:5000/api/palettes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedPalettes(res.data);
      setIsModalOpen(true);

    } catch (e) {

      console.error(e);
      showToast('Error obteniendo paletas.', 'error');

    }

  };

  const handleDeletePalette = async (id: number) => {

    try {
      await axios.delete(`http://localhost:5000/api/palettes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedPalettes(prev => prev.filter(p => p.id !== id));
      showToast('Paleta eliminada correctamente.', 'success');
      setConfirmDeleteId(null);
    } catch (e) {
      console.error(e);
      showToast('Error al eliminar la paleta.', 'error');
    }

  };

  const handleRenamePalette = async (id: number) => {

    if (!editingName.trim()) return;
    try {
      await axios.put(`http://localhost:5000/api/palettes/${id}`, { name: editingName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedPalettes(prev => prev.map(p => p.id === id ? { ...p, name: editingName } : p));
      showToast('Paleta renombrada correctamente.', 'success');
      setEditingPaletteId(null);
    } catch (e) {
      console.error(e);
      showToast('Error al renombrar la paleta.', 'error');
    }

  };

  const loadPaletteAsColors = (paletteBaseHex: string) => {

    if (!colors.includes(paletteBaseHex)) {

      if (colors.length < maxInputs) {

        setColors([...colors, paletteBaseHex]);

      } else {

        const newColors = [...colors];
        newColors[colors.length - 1] = paletteBaseHex;
        setColors(newColors);

      }

    }
    setIsModalOpen(false);

  };

  const updateColor = (index: number, newColor: string) => {

    const newColors = [...colors];
    newColors[index] = newColor;
    setColors(newColors);

  };

  const handleCopyColor = (colorStr: string) => {

    navigator.clipboard.writeText(colorStr);
    showToast(`Copiado: ${colorStr}`, 'info');

  };

  const getTextColor = (vh: number, vs: number, vl: number) => {

    const [r, g, b] = hslToRgb(vh, vs, vl);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';

  };

  const formatColorString = (vh: number, vs: number, vl: number, overrideFormat?: string) => {

    const format = overrideFormat || colorFormat;

    if (format === 'rgb') {

      const rgb = hslToRgb(vh, vs, vl);
      return `rgb(${rgb.join(', ')})`;

    } else if (format === 'hsl') {

      return `hsl(${vh}, ${vs}%, ${vl}%)`;

    }

    return hslToHex(vh, vs, vl).toUpperCase();

  };

  const renderColorColumn = (title: string, columnColors: [number, number, number][]) => {

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, minWidth: '220px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{title}</h4>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {columnColors.map(([vh, vs, vl], i) => {

            const colorStr = formatColorString(vh, vs, vl);
            const hex = hslToHex(vh, vs, vl);
            const rgb = hslToRgb(vh, vs, vl).join(', ');
            const textColor = getTextColor(vh, vs, vl);

            return (
              <div
                key={i}
                className="color-box relative"
                style={{
                  background: hex,
                  height: '75px',
                  borderRadius: '16px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s',
                  position: 'relative'
                }}
                onClick={() => handleCopyColor(colorStr)}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <span style={{
                  color: textColor,
                  fontWeight: '600',
                  fontFamily: 'monospace',
                  fontSize: '1rem',
                  letterSpacing: '0.5px'
                }}>
                  {colorStr}
                </span>

                <div className="tooltip-box" style={{
                  position: 'absolute', bottom: 'calc(100% + 5px)', left: '50%', transform: 'translateX(-50%)',
                  background: 'rgba(15, 20, 25, 0.95)', color: '#fff', padding: '0.8rem', borderRadius: '8px',
                  fontSize: '0.8rem', fontFamily: 'monospace', lineHeight: '1.4', pointerEvents: 'none',
                  whiteSpace: 'nowrap', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr', gap: '0.5rem' }}>
                    <span style={{ color: '#a777e3', fontWeight: 'bold' }}>HEX:</span> <span>{hex}</span>
                    <span style={{ color: '#6e8efb', fontWeight: 'bold' }}>RGB:</span> <span>{rgb}</span>
                    <span style={{ color: '#f5f5f7', fontWeight: 'bold' }}>HSL:</span> <span>{vh}, {vs}%, {vl}%</span>
                  </div>
                </div>
              </div>
            );

          })}
        </div>
      </div>
    );

  };

  return (
    <div>
      <style>
        {`
          .tooltip-box { opacity: 0; transition: opacity 0.2s; }
          .color-box:hover .tooltip-box { opacity: 1; }
          .color-circle-wrapper:hover .btn-overlay-circle { opacity: 1 !important; }
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          .toast-item {
            animation: slideIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
          }
          .color-circle-wrapper:hover .go-to-palette-badge { opacity: 1 !important; pointer-events: auto !important; }
          @keyframes slideInY {
            from { transform: translateY(-10px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          /* Ocultar flechas nativas de input number */
          input::-webkit-outer-spin-button,
          input::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          input[type=number] {
            -moz-appearance: textfield;
          }
          /* Custom overrides for react-colorful */
          .react-colorful {
            width: 180px !important;
            height: 180px !important;
          }
          .react-colorful__saturation {
            border-bottom: none !important;
            border-radius: 12px 12px 0 0 !important;
          }
          .react-colorful__hue {
            height: 14px !important;
            border-radius: 0 0 12px 12px !important;
            margin-top: 8px !important;
          }
          .react-colorful__pointer {
            width: 20px !important;
            height: 20px !important;
            border-width: 3px !important;
          }
        `}
      </style>

      {/* --- Contenedor de Toasts --- */}
      <div style={{
        position: 'fixed', top: '20px', right: '20px',
        zIndex: 10000, display: 'flex', flexDirection: 'column', gap: '10px'
      }}>
        {toasts.map(t => (
          <div key={t.id} className="toast-item" style={{
            minWidth: '240px', padding: '1rem 1.5rem', borderRadius: '12px',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            background: t.type === 'error' ? 'rgba(255, 60, 60, 0.2)' :
              t.type === 'info' ? 'rgba(110, 142, 251, 0.2)' :
                'rgba(167, 119, 227, 0.2)',
            border: `1px solid ${t.type === 'error' ? 'rgba(255, 60, 60, 0.3)' :
              t.type === 'info' ? 'rgba(110, 142, 251, 0.3)' :
                'rgba(167, 119, 227, 0.3)'}`,
            color: '#fff', fontSize: '0.95rem', fontWeight: 'bold',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', gap: '0.8rem'
          }}>
            <span style={{ fontSize: '1.2rem' }}>
              {t.type === 'error' ? '✖' : t.type === 'info' ? 'ℹ' : '✔'}
            </span>
            {t.message}
          </div>
        ))}
      </div>

      <div className="glass-panel" style={{
        display: 'flex', flexDirection: 'column', gap: '1.5rem',
        position: 'relative', zIndex: pickerOpenIndex !== null ? 100 : 2
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            Coloristia
            {user?.role === 'PREMIUM' && (
              <span style={{
                fontSize: '0.6em',
                background: 'linear-gradient(135deg, #6e8efb 0%, #a777e3 100%)',
                padding: '2px 8px',
                borderRadius: '6px',
                textTransform: 'lowercase',
                fontWeight: 'bold',
                letterSpacing: '1px',
                boxShadow: '0 2px 8px rgba(110, 142, 251, 0.3)'
              }}>pro</span>
            )}
          </h2>
          {user && user.role !== 'GUEST' && (
            <button className="button-secondary" onClick={handleFetchPalettes} style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', color: 'var(--text-primary)', fontWeight: 'bold' }}>
              Mis Paletas
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center', flexWrap: 'wrap' }}>

          <CustomSelect
            label="Sistema de color:"
            value={colorFormat}
            onChange={setColorFormat}
            options={[
              { value: 'hex', label: 'HEX' },
              { value: 'rgb', label: 'RGB' },
              { value: 'hsl', label: 'HSL' }
            ]}
          />

          {user?.role !== 'GUEST' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <label style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Variaciones ({minVariations}-{maxVariations}):</label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '2px',
                width: 'fit-content'
              }}>
                <button
                  onClick={() => setVariationsCount(prev => Math.max(minVariations, prev - 1))}
                  disabled={variationsCount <= minVariations}
                  style={{
                    width: '36px', height: '36px', borderRadius: '10px', border: 'none',
                    background: 'transparent', color: '#fff', fontSize: '1.2rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                    opacity: (variationsCount <= minVariations) ? 0.3 : 1
                  }}
                  onMouseEnter={(e) => { if (e.currentTarget.style.opacity !== '0.3') e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >-</button>

                <input
                  type="number"
                  style={{
                    width: '50px',
                    textAlign: 'center',
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 'bold',
                    outline: 'none',
                    fontSize: '1rem'
                  }}
                  min={minVariations} max={maxVariations} value={variationsCount}
                  onChange={(e) => { const val = parseInt(e.target.value); setVariationsCount(isNaN(val) ? minVariations : val); }}
                  onBlur={() => {
                    if (variationsCount > maxVariations) setVariationsCount(maxVariations);
                    if (variationsCount < minVariations) setVariationsCount(minVariations);
                  }}
                />

                <button
                  onClick={() => setVariationsCount(prev => Math.min(maxVariations, prev + 1))}
                  disabled={variationsCount >= maxVariations}
                  style={{
                    width: '36px', height: '36px', borderRadius: '10px', border: 'none',
                    background: 'transparent', color: '#fff', fontSize: '1.2rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                    opacity: (variationsCount >= maxVariations) ? 0.3 : 1
                  }}
                  onMouseEnter={(e) => { if (e.currentTarget.style.opacity !== '0.3') e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >+</button>
              </div>
            </div>
          )}

          {/* Grupo de Botones de Acción */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', height: '100%' }}>
            {/* Botón Agregar Color */}
            {colors.length < maxInputs && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <label style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'transparent' }}>.</label>
                <button
                  className="button-primary"
                  onClick={addColor}
                  title="Agregar Color"
                  style={{
                    height: '42px', width: '42px', borderRadius: '12px',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    fontSize: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    background: 'linear-gradient(135deg, #a777e3 0%, #6e8efb 100%)',
                    border: 'none', color: '#fff', cursor: 'pointer', transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >+</button>
              </div>
            )}

            {/* Botón Color Azar / Recargar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <label style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'transparent' }}>.</label>
              <button
                onClick={() => {
                  const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0').toUpperCase();
                  if (colors.length > 1) {
                    const newColors = [...colors];
                    newColors[newColors.length - 1] = randomColor;
                    setColors(newColors);
                    showToast(`Último color cambiado: ${randomColor}`, 'info');
                  } else {
                    setColors([randomColor]);
                    showToast(`Nueva paleta aleatoria: ${randomColor}`, 'info');
                  }
                }}
                title="Color Aleatorio"
                style={{
                  height: '42px', width: '42px', borderRadius: '12px',
                  display: 'flex', justifyContent: 'center', alignItems: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer', transition: 'all 0.2s',
                  outline: 'none',
                  padding: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px', display: 'block' }}>
                  <path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                  <path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
                </svg>
              </button>
            </div>

            {/* Botón Borrar Todo con Etiqueta Unificada */}
            {colors.length > 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <label style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'transparent' }}>.</label>
                <button
                  onClick={() => {
                    setColors([colors[0]]);
                    showToast('Paleta reseteada al color base', 'info');
                  }}
                  title="Borrar todos los colores"
                  style={{
                    height: '42px', display: 'flex', alignItems: 'center', gap: '0.8rem',
                    background: 'rgba(255, 60, 60, 0.08)', padding: '0 16px 0 6px',
                    borderRadius: '14px', border: '1px solid rgba(255, 60, 60, 0.2)',
                    cursor: 'pointer', transition: 'all 0.2s', outline: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 60, 60, 0.15)';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 60, 60, 0.08)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <div style={{
                    height: '32px', width: '32px', borderRadius: '10px',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    background: 'rgba(255, 60, 60, 0.2)',
                    border: '1px solid rgba(255, 60, 60, 0.3)'
                  }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
                      <path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#ff6b6b', whiteSpace: 'nowrap' }}>Borrar colores</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '3rem', alignItems: 'center', marginTop: '2.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {colors.map((c, i) => (
            <div key={i} className="color-circle-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', position: 'relative' }}>
              {/* Etiqueta flotante "Ir a la paleta" */}
              {colors.length > 1 && (
                <div
                  className="go-to-palette-badge"
                  onClick={() => document.getElementById(`palette-${i}`)?.scrollIntoView({ behavior: 'smooth' })}
                  style={{
                    position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap', background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                    padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem',
                    color: '#fff', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer', transition: 'all 0.3s ease', opacity: 0, pointerEvents: 'none',
                    zIndex: 50, boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                  }}
                >
                  Ir a la paleta
                </div>
              )}

              <div
                style={{
                  position: 'relative', width: '130px', height: '130px', borderRadius: '50%',
                  boxShadow: `0 8px 32px ${c}40`, border: '4px solid rgba(255,255,255,0.1)',
                  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer',
                  backgroundColor: c, overflow: 'visible' // Permitir que el popover sobresalga
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {/* Overlay de botones al hacer Hover */}
                <div className="btn-overlay-circle"
                  style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem',
                    opacity: 0, transition: 'all 0.3s ease',
                    backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
                    zIndex: 30, borderRadius: '50%', background: 'rgba(0, 0, 0, 0.3)'
                  }}
                >
                  {/* Botón Abrir Selector */}
                  <div
                    onClick={(e) => { e.stopPropagation(); setPickerOpenIndex(i); }}
                    style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: '1.1rem', transition: 'all 0.2s',
                      cursor: 'pointer', border: '1px solid rgba(255,255,255,0.3)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                    title="Cambiar Color"
                  >
                    ✎
                  </div>

                  {/* Botón Eliminar (si hay más de 1) */}
                  {colors.length > 1 && (
                    <div
                      onClick={(e) => { e.stopPropagation(); removeColor(i); }}
                      style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        background: 'rgba(255, 60, 60, 0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: '1.1rem', transition: 'all 0.2s',
                        cursor: 'pointer', border: '1px solid rgba(255,60,60,0.4)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 60, 60, 0.5)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 60, 60, 0.3)'}
                      title="Borrar Color"
                    >
                      ✕
                    </div>
                  )}
                </div>

                {/* Popover del Color Picker Premium */}
                {pickerOpenIndex === i && (
                  <div
                    ref={pickerRef}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: 'absolute', top: '110%', left: '50%', transform: 'translateX(-50%)',
                      zIndex: 1000, background: 'rgba(15, 20, 25, 0.98)',
                      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                      padding: '1.2rem', borderRadius: '24px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
                      display: 'flex', flexDirection: 'column', gap: '0.8rem',
                      animation: 'slideInY 0.2s ease-out'
                    }}
                  >
                    <HexColorPicker
                      color={c}
                      onChange={(newColor) => updateColor(i, newColor.toUpperCase())}
                    />
                    <div style={{
                      fontSize: '0.9rem', color: '#a777e3', fontWeight: 'bold',
                      textAlign: 'center', fontFamily: 'monospace', letterSpacing: '1px'
                    }}>
                      {c}
                    </div>
                  </div>
                )}
              </div>

              <ColorTextInput
                colorHex={c}
                format={colorFormat}
                onChange={(newColor) => updateColor(i, newColor)}
                formatColorString={formatColorString}
              />
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '2rem' }}>
        {colors.map((c, idx) => (
          <div key={idx} id={`palette-${idx}`}>
            <PaletteSection
              baseHex={c}
              user={user}
              token={token}
              variationsCount={variationsCount}
              renderColorColumn={renderColorColumn}
              showToast={showToast}
            />
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)' }}>
          <div className="glass-panel" style={{ width: '650px', maxHeight: '85vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: '#fff', fontSize: '1.6rem', cursor: 'pointer', opacity: 0.7 }}>✕</button>
            <h2 style={{ marginBottom: '2rem', textAlign: 'center' }}>Mis Paletas Guardadas</h2>

            {savedPalettes.length === 0 ? (
              <p style={{ textAlign: 'center', opacity: 0.6 }}>No tienes paletas guardadas aún.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {savedPalettes.map(p => (
                  <div key={p.id} style={{ display: 'flex', flexDirection: 'column', padding: '1.2rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', gap: '1rem', transition: 'all 0.3s' }}>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                        <div style={{ width: '55px', height: '55px', borderRadius: '12px', background: p.colors?.base || '#fff', border: '2px solid rgba(255,255,255,0.1)' }}></div>
                        <div>
                          {editingPaletteId === p.id ? (
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <input
                                className="input-glass"
                                style={{ fontSize: '1rem', width: '180px', padding: '0.4rem 0.8rem' }}
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                autoFocus
                              />
                              <button onClick={() => handleRenamePalette(p.id)} style={{ color: '#6e8efb', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✔</button>
                              <button onClick={() => setEditingPaletteId(null)} style={{ color: '#ff3c3c', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                            </div>
                          ) : (
                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {p.name}
                              <span
                                onClick={() => { setEditingPaletteId(p.id); setEditingName(p.name); }}
                                style={{ cursor: 'pointer', opacity: 0.4, fontSize: '0.85rem' }}
                              >✏️</span>
                            </div>
                          )}
                          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: '4px' }}>{new Date(p.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                        <button
                          className="button-primary"
                          style={{ padding: '0.64rem 1.2rem', borderRadius: '8px', fontSize: '0.85rem' }}
                          onClick={() => loadPaletteAsColors(p.colors?.base)}
                        >
                          Cargar
                        </button>

                        <button
                          onClick={() => setConfirmDeleteId(p.id)}
                          style={{
                            background: 'rgba(255, 60, 60, 0.1)', border: '1px solid rgba(255, 60, 60, 0.2)',
                            color: '#ff3c3c', width: '40px', height: '40px', borderRadius: '8px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 60, 60, 0.2)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 60, 60, 0.1)'}
                          title="Eliminar Paleta"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {confirmDeleteId === p.id && (
                      <div style={{
                        background: 'rgba(255, 60, 60, 0.15)', border: '1px solid rgba(255, 60, 60, 0.3)',
                        borderRadius: '12px', padding: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        animation: 'slideIn 0.3s ease-out'
                      }}>
                        <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 'bold' }}>¿Confirmar para eliminar?</span>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <button onClick={() => handleDeletePalette(p.id)} style={{ color: '#ff3c3c', background: 'transparent', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}>SÍ, ELIMINAR</button>
                          <button onClick={() => setConfirmDeleteId(null)} style={{ color: '#fff', background: 'transparent', border: 'none', fontWeight: '300', cursor: 'pointer', fontSize: '0.9rem' }}>CANCELAR</button>
                        </div>
                      </div>
                    )}

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Botón ToUp Inteligente */}
      {isScrolledPastPalette0 && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{
            position: 'fixed', bottom: '2.5rem', right: '3rem',
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff', fontSize: '1.2rem', cursor: 'pointer',
            zIndex: 10000, transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: isMouseActive ? 1 : 0,
            transform: isMouseActive ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.7)',
            pointerEvents: isMouseActive ? 'auto' : 'none',
            boxShadow: '0 15px 45px rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            outline: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
            e.currentTarget.style.boxShadow = '0 15px 45px rgba(110, 142, 251, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 15px 45px rgba(0,0,0,0.6)';
          }}
        >
          <svg viewBox="0 0 24 24" width="26" height="26" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
        </button>
      )}

      {/* Footer Profesional - Eber Sánchez Cornejo */}
      <footer className="glass-panel" style={{
        marginTop: '6rem',
        padding: '3rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2rem',
        border: 'none',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(15, 17, 21, 0.4)'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '3rem', width: '100%', maxWidth: '1000px' }}>

          <div style={{ flex: '1', minWidth: '250px' }}>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '1rem', background: 'linear-gradient(135deg, #a777e3 0%, #6e8efb 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 'bold' }}>Coloristia</h3>
            <p style={{ opacity: 0.6, fontSize: '0.9rem', lineHeight: '1.6' }}>
              Herramienta profesional de generación de paletas cromáticas impulsada por la pasión del diseño y la tecnología.
              Desarrollada por Eber Sánchez Cornejo. ✨
            </p>
          </div>

          <div style={{ flex: '1', minWidth: '200px' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '1.2rem', fontWeight: 'bold' }}>Enlaces Rápidos</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <a href="https://www.ebersanchez.cl" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#a777e3'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>Sitio Web Oficial</a>
              <a href="https://www.ebersanchez.cl/portafolio" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#a777e3'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>Portafolio Profesional</a>
              <a href="https://github.com/eber110" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#a777e3'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>GitHub (eber110)</a>
            </div>
          </div>

          <div style={{ flex: '1', minWidth: '200px' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '1.2rem', fontWeight: 'bold' }}>Contacto</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <a href="mailto:contacto@ebersanchez.cl" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#6e8efb'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>contacto@ebersanchez.cl</a>
              <p style={{ opacity: 0.4, fontSize: '0.8rem', marginTop: '0.5rem' }}>Eber Sánchez Cornejo. © 2026</p>
            </div>
          </div>

        </div>

        <div style={{ width: '100%', height: '1px', background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)', margin: '1rem 0' }}></div>

        <p style={{ opacity: 0.3, fontSize: '0.75rem', letterSpacing: '1px' }}> HECHO POR EBER SÁNCHEZ CORNEJO </p>
      </footer>
    </div>
  );

}
