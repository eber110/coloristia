import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
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
  
  const [colors, setColors] = useState<string[]>(() => [getRandomHex()]);
  const [variationsCount, setVariationsCount] = useState<number>(() => {
  
    const saved = localStorage.getItem('variationsCount');
    return saved ? parseInt(saved, 10) : 4;
    
  });
  const [colorFormat, setColorFormat] = useState<string>('hex');
  const [isModalOpen, setIsModalOpen] = useState(false);

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
  const maxInputs = user?.role === 'PREMIUM' ? 10 : user?.role === 'REGISTERED' ? 3 : 1;
  const maxVariations = user?.role === 'PREMIUM' ? 15 : user?.role === 'REGISTERED' ? 10 : 4;
  const minVariations = user?.role === 'GUEST' ? 4 : 2;

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
      
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <h2>Creador HSL WOW</h2>
          {user && user.role !== 'GUEST' && (
            <button className="button-secondary" onClick={handleFetchPalettes} style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', color: 'var(--text-primary)', fontWeight: 'bold' }}>
              Mis Paletas
            </button>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <label style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Sistema de color:</label>
            <div style={{ position: 'relative' }}>
              <select className="input-glass" style={{ width: '250px', appearance: 'none', padding: '0.8rem 1.2rem', cursor: 'pointer', fontWeight: '600' }} value={colorFormat} onChange={(e) => setColorFormat(e.target.value)}>
                <option value="hex">HEX</option>
                <option value="rgb">RGB</option>
                <option value="hsl">HSL</option>
              </select>
              <div style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-secondary)' }}>▼</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <label style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Variaciones ({minVariations}-{maxVariations}):</label>
            <input type="number" className="input-glass" style={{ width: '120px' }} min={minVariations} max={maxVariations} value={variationsCount}
              onChange={(e) => { const val = parseInt(e.target.value); setVariationsCount(isNaN(val) ? minVariations : val); }}
              onBlur={() => {
                if (variationsCount > maxVariations) setVariationsCount(maxVariations);
                if (variationsCount < minVariations) setVariationsCount(minVariations);
              }}
              disabled={user?.role === 'GUEST'}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '3rem', alignItems: 'center', marginTop: '2.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {colors.map((c, i) => (
            <div key={i} className="color-circle-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', position: 'relative' }}>
              <div style={{
                position: 'relative', width: '130px', height: '130px', borderRadius: '50%', overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)', border: '4px solid rgba(255,255,255,0.1)',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer'
              }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <input 
                  id={`color-input-${i}`}
                  type="color" 
                  style={{ position: 'absolute', top: '-10%', left: '-10%', width: '120%', height: '120%', padding: '0', border: 'none', cursor: 'pointer', background: 'transparent' }}
                  value={c} onChange={(e) => updateColor(i, e.target.value)} />
                
                {colors.length > 1 ? (
                  <div className="btn-overlay-circle"
                    style={{
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem',
                      opacity: 0, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                      backdropFilter: 'blur(8px)',
                      zIndex: 30, borderRadius: '50%', background: 'rgba(15, 20, 25, 0.4)'
                    }}
                  >
                    {/* Botón Cambiar Color */}
                    <div 
                      title="Cambiar Color"
                      style={{ 
                        width: '42px', height: '42px', borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.15)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: '1.2rem', transition: 'all 0.2s',
                        cursor: 'pointer', border: '1px solid rgba(255,255,255,0.2)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      onClick={() => {
                        const inputElement = document.getElementById(`color-input-${i}`);
                        if (inputElement) inputElement.click();
                      }}
                    >
                      ✎
                    </div>

                    {/* Botón Borrar */}
                    <div 
                      title="Borrar Color"
                      style={{ 
                        width: '42px', height: '42px', borderRadius: '50%',
                        background: 'rgba(255, 60, 60, 0.3)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: '1.2rem', transition: 'all 0.2s',
                        cursor: 'pointer', border: '1px solid rgba(255,60,60,0.4)',
                        boxShadow: '0 4px 12px rgba(255, 60, 60, 0.2)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 60, 60, 0.5)';
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 60, 60, 0.3)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      onClick={(e) => { e.stopPropagation(); removeColor(i); }}
                    >
                      ✕
                    </div>
                  </div>
                ) : (
                  /* Solo Cambiar */
                  <div className="btn-overlay-circle"
                    onClick={() => {
                      const inputElement = document.getElementById(`color-input-${i}`);
                      if (inputElement) inputElement.click();
                    }}
                    style={{
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: 0, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                      backdropFilter: 'blur(8px)',
                      zIndex: 30, borderRadius: '50%', cursor: 'pointer',
                      background: 'rgba(15, 20, 25, 0.4)', color: '#fff'
                    }}
                  >
                    <div style={{ 
                      width: '50px', height: '50px', borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.15)', border: '1px solid rgba(255,255,255,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem'
                    }}>✎</div>
                  </div>
                )}
              </div>
              <ColorTextInput colorHex={c} format={colorFormat} onChange={(newHex) => updateColor(i, newHex)} formatColorString={formatColorString} />
            </div>
          ))}
          {colors.length < maxInputs && (
            <button className="button-primary" onClick={addColor} style={{ height: '90px', width: '90px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '2.5rem', boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }}>+</button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '2rem' }}>
        {colors.map((c, idx) => (
          <div key={idx}>
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
                   <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.2rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                       <div style={{ width: '55px', height: '55px', borderRadius: '12px', background: p.colors?.base || '#fff', border: '2px solid rgba(255,255,255,0.1)' }}></div>
                       <div>
                         <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#fff' }}>{p.name}</div>
                         <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: '4px' }}>{new Date(p.createdAt).toLocaleDateString()}</div>
                       </div>
                     </div>
                     <button className="button-primary" style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', fontSize: '0.85rem' }} onClick={() => loadPaletteAsColors(p.colors?.base)}>
                       Cargar
                     </button>
                   </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
  
}
