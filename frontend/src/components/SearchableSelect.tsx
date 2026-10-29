import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';

interface Option {
  id: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.id === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(o => 
    o.label.toLowerCase().includes(search.toLowerCase()) || 
    (o.sublabel && o.sublabel.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div 
        className="form-input" 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          cursor: 'pointer',
          background: 'rgba(255, 255, 255, 0.05)',
          minHeight: '44px',
          padding: '0 16px',
          borderRadius: '10px',
          border: '1px solid var(--border-color)'
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={{ 
          color: selectedOption ? 'var(--text-primary)' : 'var(--text-muted)', 
          fontSize: '0.875rem',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          marginRight: '8px'
        }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          right: 0,
          zIndex: 9999,
          background: '#fff', 
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          boxShadow: '0 15px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)',
          maxHeight: '350px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'dropdownFade 0.2s ease-out'
        }}>
          <style>{`
            @keyframes dropdownFade {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          
          <div style={{ 
            padding: '12px', 
            borderBottom: '1px solid var(--border-color)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            background: 'rgba(0,0,0,0.02)'
          }}>
            <Search size={16} color="var(--text-muted)" />
            <input 
              autoFocus
              type="text" 
              placeholder="Search registry..." 
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: 'var(--text-primary)', 
                width: '100%', 
                outline: 'none', 
                fontSize: '0.9rem',
                padding: '4px 0'
              }} 
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          </div>

          <div style={{ overflowY: 'auto', padding: '6px' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No matches found in matrix
              </div>
            ) : (
              filteredOptions.map(option => (
                <div 
                  key={option.id}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    margin: '2px 0',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: value === option.id ? 'var(--accent-primary)' : 'transparent',
                    color: value === option.id ? '#fff' : 'var(--text-primary)'
                  }}
                  onMouseEnter={e => { if (value !== option.id) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                  onMouseLeave={e => { if (value !== option.id) e.currentTarget.style.background = 'transparent'; }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(option.id);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{option.label}</div>
                  {option.sublabel && <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '2px' }}>{option.sublabel}</div>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );

};

export default SearchableSelect;
