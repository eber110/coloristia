import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { hexToHsl, hslToHex, getMonochromaticVariations, getAnalogousVariations, getComplementaryVariations, getTriadicVariations, getSplitComplementaryVariations, hslToRgb } from '../utils/colorUtils';

export default function Home() {

  const { user } = useAuth();
  
  const [colors, setColors] = useState<string[]>(['#ff0000']);
  const [variationsCount, setVariationsCount] = useState<number>(4);
  const [colorFormat, setColorFormat] = useState<string>('hex');
  
  // Limites por rol
  const maxInputs = user?.role === 'PREMIUM' ? 10 : user?.role === 'REGISTERED' ? 3 : 1;
  const maxVariations = user?.role === 'PREMIUM' ? 15 : user?.role === 'REGISTERED' ? 10 : 4;
  const minVariations = user?.role === 'GUEST' ? 4 : 2;

  // Actualizar limites cuando cambie el usr
  useEffect(() => {
  
    if (colors.length > maxInputs) {
    
      setColors(colors.slice(0, maxInputs));
      
    }
    
    if (variationsCount > maxVariations) {
    
      setVariationsCount(maxVariations);
      
    }
    
    if (variationsCount < minVariations) {
    
      setVariationsCount(minVariations);
      
    }
    
  }, [user, maxInputs, maxVariations, minVariations]);

  const addColor = () => {
  
    if (colors.length < maxInputs) {
    
      setColors([...colors, '#000000']);
      
    }
    
  };

  const updateColor = (index: number, newColor: string) => {
  
    const newColors = [...colors];
    newColors[index] = newColor;
    setColors(newColors);
    
  };

  const handleCopyColor = (colorStr: string) => {
  
    navigator.clipboard.writeText(colorStr);
    
  };

  const getTextColor = (vh: number, vs: number, vl: number) => {
  
    const [r, g, b] = hslToRgb(vh, vs, vl);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
    
  };

  const formatColorString = (vh: number, vs: number, vl: number) => {
  
    if (colorFormat === 'rgb') {
    
      const rgb = hslToRgb(vh, vs, vl);
      return `rgb(${rgb.join(', ')})`;
      
    } else if (colorFormat === 'hsl') {
    
      return `hsl(${vh}, ${vs}%, ${vl}%)`;
      
    }
    
    return hslToHex(vh, vs, vl);
    
  };

  const renderColorColumn = (title: string, colors: [number, number, number][]) => {
  
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, minWidth: '220px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{title}</h4>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {colors.map(([vh, vs, vl], i) => {
          
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
                
                {/* Custom Tooltip */}
                <div 
                  className="tooltip-box" 
                  style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 5px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(15, 20, 25, 0.95)',
                    color: '#fff',
                    padding: '0.8rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontFamily: 'monospace',
                    lineHeight: '1.4',
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap',
                    zIndex: 10,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}
                >
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

  // Convertir a interfaz UI
  const renderPalette = (baseHex: string) => {
  
    const [h, s, l] = hexToHsl(baseHex);
    
    const analogousColors = getAnalogousVariations(h, s, l, variationsCount);
    const monochromaticColors = getMonochromaticVariations(h, s, l, variationsCount);
    const complementaryColors = getComplementaryVariations(h, s, l, variationsCount);
    const triadicColors = getTriadicVariations(h, s, l, variationsCount);
    const splitComplementaryColors = getSplitComplementaryVariations(h, s, l, variationsCount);
    
    return (
      <div className="glass-panel" style={{ marginTop: '3rem', position: 'relative' }}>
        <h3 style={{ marginBottom: '2.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', fontSize: '1.5rem', fontWeight: 'bold' }}>Combinaciones (Base: {baseHex})</h3>
        <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {renderColorColumn('Análoga', analogousColors)}
          {renderColorColumn('Monocromática', monochromaticColors)}
          {renderColorColumn('Complementaria', complementaryColors)}
          {renderColorColumn('Triada', triadicColors)}
          {renderColorColumn('Complementaria Dividida', splitComplementaryColors)}
        </div>
      </div>
    );
    
  };

  return (
    <div>
      <style>
        {`
          .tooltip-box {
            opacity: 0;
            transition: opacity 0.2s;
          }
          .color-box:hover .tooltip-box {
            opacity: 1;
          }
        `}
      </style>
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h2>Creador HSL WOW</h2>
        
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Sistema de color:</label>
            <select 
              className="input-glass" 
              style={{ width: '250px' }}
              value={colorFormat} 
              onChange={(e) => setColorFormat(e.target.value)}
            >
              <option value="hex">HEX</option>
              <option value="rgb">RGB</option>
              <option value="hsl">HSL</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Variaciones ({minVariations}-{maxVariations}):</label>
            <input 
              type="number" 
              className="input-glass" 
              style={{ width: '120px' }}
              min={minVariations} 
              max={maxVariations} 
              value={variationsCount}
              onChange={(e) => setVariationsCount(parseInt(e.target.value) || minVariations)}
              disabled={user?.role === 'GUEST'}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '3rem', alignItems: 'center', marginTop: '2.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {colors.map((c, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
              <div 
                style={{
                  position: 'relative',
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  border: '4px solid rgba(255,255,255,0.15)',
                  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <input 
                  type="color" 
                  style={{ 
                    position: 'absolute',
                    top: '-25%',
                    left: '-25%',
                    width: '150%', 
                    height: '150%', 
                    padding: '0', 
                    border: 'none', 
                    cursor: 'pointer',
                    background: 'transparent'
                  }}
                  value={c} 
                  onChange={(e) => updateColor(i, e.target.value)} 
                />
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold', fontFamily: 'monospace', color: 'var(--text-primary)' }}>{c.toUpperCase()}</span>
            </div>
          ))}
          
          {colors.length < maxInputs && (
            <button className="button-primary" onClick={addColor} style={{ height: '90px', width: '90px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '2.5rem', boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }}>+</button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '2rem' }}>
        {colors.map((c, i) => (
          <div key={i}>
            {renderPalette(c)}
          </div>
        ))}
      </div>
    </div>
  );
  
}
