import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const CalendarioPremium = ({ selectedDate, onSelect, maxDate, onClose }: { selectedDate: string, onSelect: (date: string) => void, maxDate: string, onClose: () => void }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate + 'T12:00:00'));
    const calendarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const diasSemana = ['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do'];
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
    const daysInMonth = getDaysInMonth(year, month);

    const getFirstDayOfMonth = (y: number, m: number) => {
        const d = new Date(y, m, 1).getDay();
        return d === 0 ? 6 : d - 1;
    };
    const firstDay = getFirstDayOfMonth(year, month);

    const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

    const daysPrevMonth = Array.from({ length: firstDay }, (_, i) => {
        const lastDayPrev = new Date(year, month, 0).getDate();
        return lastDayPrev - firstDay + i + 1;
    });

    const daysNextMonth = Array.from({ length: Math.max(0, 35 - (firstDay + daysInMonth)) }, (_, i) => i + 1);

    const isSelected = (d: number, m: number, y: number) => {
        const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        return dateStr === selectedDate;
    };

    const isDisabled = (d: number, m: number, y: number) => {
        const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        return dateStr > maxDate;
    };

    return (
        <div ref={calendarRef} className="card" style={{ padding: '16px', width: '220px', borderRadius: '24px', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-lg)', background: 'var(--card)', position: 'relative' }}>
            <button
                type="button"
                onClick={onClose}
                style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 10, padding: '4px', borderRadius: '8px' }}
                onMouseOver={(e) => {
                    e.currentTarget.style.color = 'var(--text)';
                    e.currentTarget.style.background = 'var(--bg)';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.color = 'var(--text-muted)';
                    e.currentTarget.style.background = 'none';
                }}
            >
                <X size={16} />
            </button>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <button type="button" onClick={prevMonth} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '18px' }}>‹</button>
                <h3 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text)' }}>{meses[month]} {year}</h3>
                <button type="button" onClick={nextMonth} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '18px' }}>›</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', textAlign: 'center' }}>
                {diasSemana.map(d => (
                    <span key={d} style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', paddingBottom: '6px' }}>{d}</span>
                ))}

                {daysPrevMonth.map(d => (
                    <div key={`p-${d}`} style={{ padding: '6px 0', fontSize: '11px', color: 'var(--text-muted)', opacity: 0.3 }}>{d}</div>
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const selected = isSelected(day, month, year);
                    const disabled = isDisabled(day, month, year);
                    return (
                        <div
                            key={day}
                            onClick={() => !disabled && onSelect(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)}
                            style={{
                                padding: '6px 0',
                                fontSize: '11px',
                                fontWeight: selected ? '700' : '400',
                                color: selected ? 'var(--primary)' : disabled ? 'var(--text-muted)' : 'var(--text)',
                                opacity: disabled ? 0.3 : 1,
                                cursor: disabled ? 'default' : 'pointer',
                                borderRadius: '6px',
                                background: selected ? 'var(--primary)15' : 'transparent'
                            }}
                        >
                            {day}
                        </div>
                    );
                })}

                {daysNextMonth.map(d => (
                    <div key={`n-${d}`} style={{ padding: '6px 0', fontSize: '11px', color: 'var(--text-muted)', opacity: 0.3 }}>{d}</div>
                ))}
            </div>
        </div>
    );
};

export default CalendarioPremium;
