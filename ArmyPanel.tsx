import React, { useState, useRef, useEffect } from 'react';
import { PlayerState, ArmyUnit, UnitStatus } from '../types';
import { UnitStatModal } from './UnitStatModal';

interface ArmyPanelProps {
  playerState: PlayerState;
  title: string;
  playerId: 'player1' | 'player2';
  onUpdateUnitStatus: (
    playerId: 'player1' | 'player2',
    unitType: 'characters' | 'core' | 'special' | 'rare',
    unitIndex: number,
    status: UnitStatus
  ) => void;
  onSaveArmy: () => void;
}

const getStatusColor = (status?: UnitStatus) => {
  switch (status) {
    case UnitStatus.ENGAGED: return 'bg-orange-500';
    case UnitStatus.WIPED_OUT: return 'bg-red-700';
    case UnitStatus.PSYCHOLOGICAL_SHOCK: return 'bg-purple-500';
    case UnitStatus.READY:
    default:
      return 'bg-green-500';
  }
};

interface UnitCardProps {
  unit: ArmyUnit;
  type: string;
  onUpdateStatus: (status: UnitStatus) => void;
  onViewStats: (unit: ArmyUnit) => void;
}

const UnitCard: React.FC<UnitCardProps> = ({ unit, type, onUpdateStatus, onViewStats }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const status = unit.status || UnitStatus.READY;

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: globalThis.MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  const handleStatusChange = (newStatus: UnitStatus) => {
    onUpdateStatus(newStatus);
    setIsMenuOpen(false);
  };

  return (
    <div 
      className="bg-gray-800 p-3 rounded-lg shadow-md mb-2 cursor-pointer hover:bg-gray-700/50 transition-colors"
      onClick={() => onViewStats(unit)}
    >
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-amber-200">{unit.name_en}</h4>
        <span className="text-xs bg-gray-700 px-2 py-1 rounded">{type}</span>
      </div>
      <p className="text-sm text-gray-400 mb-2">{unit.points} pts {unit.strength ? `| ${unit.strength} models` : ''}</p>
      
      <div ref={wrapperRef} className="relative inline-block text-left">
        <div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen)}
            }
            aria-haspopup="true"
            aria-expanded={isMenuOpen}
            className="flex items-center gap-2 text-xs font-medium text-gray-300 bg-gray-700/50 hover:bg-gray-700 px-3 py-1 rounded-full transition-colors"
          >
            <span className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} aria-hidden="true"></span>
            {status}
            <svg className="-mr-1 h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        {isMenuOpen && (
          <div className="origin-top-left absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-gray-900 ring-1 ring-amber-600 ring-opacity-50 focus:outline-none z-10" role="menu" aria-orientation="vertical" aria-labelledby="menu-button">
            <div className="py-1" role="none">
              {Object.values(UnitStatus).map(s => (
                <button
                  key={s}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange(s)
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-amber-800"
                  role="menuitem"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const ArmyPanel: React.FC<ArmyPanelProps> = ({ playerState, title, playerId, onUpdateUnitStatus, onSaveArmy }) => {
  const { army } = playerState;
  const [selectedUnit, setSelectedUnit] = useState<ArmyUnit | null>(null);

  const handleViewStats = (unit: ArmyUnit) => {
    setSelectedUnit(unit);
  };

  if (!army) {
    return (
      <div className="bg-gray-800/50 p-6 rounded-lg shadow-xl border border-gray-700 flex flex-col items-center justify-center h-full">
        <h3 className="font-medieval text-2xl text-gray-500 mb-2">{title}</h3>
        <p className="text-gray-600">Import an army list to begin.</p>
      </div>
    );
  }

  const general = army.characters.find(c => c.command?.some((cmd: any) => cmd.active && cmd.name_en === 'General'))?.name_en || army.characters[0]?.name_en || 'Unknown General';

  return (
    <div className="bg-gray-800/50 p-4 rounded-lg shadow-xl border border-gray-700 h-full flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-medieval text-2xl text-amber-400">{army.name}</h3>
          <p className="text-sm text-gray-400">Led by {general}</p>
        </div>
        <button 
            onClick={onSaveArmy}
            title="Save this army to the Barracks"
            className="text-gray-400 hover:text-amber-400 transition-colors p-1 rounded-full hover:bg-gray-700"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
        </button>
      </div>
      <div className="flex justify-between items-baseline mb-4 px-2">
        <span className="text-gray-300 font-semibold">{army.army}</span>
        <span className="font-bold text-lg text-amber-200">{army.points} pts</span>
      </div>
      <div className="overflow-y-auto flex-grow pr-2">
        {army.characters.length > 0 && army.characters.map((unit, i) => <UnitCard key={`char-${i}`} unit={unit} type="Character" onUpdateStatus={(status) => onUpdateUnitStatus(playerId, 'characters', i, status)} onViewStats={handleViewStats} />)}
        {army.core.length > 0 && army.core.map((unit, i) => <UnitCard key={`core-${i}`} unit={unit} type="Core" onUpdateStatus={(status) => onUpdateUnitStatus(playerId, 'core', i, status)} onViewStats={handleViewStats} />)}
        {army.special.length > 0 && army.special.map((unit, i) => <UnitCard key={`spec-${i}`} unit={unit} type="Special" onUpdateStatus={(status) => onUpdateUnitStatus(playerId, 'special', i, status)} onViewStats={handleViewStats} />)}
        {army.rare.length > 0 && army.rare.map((unit, i) => <UnitCard key={`rare-${i}`} unit={unit} type="Rare" onUpdateStatus={(status) => onUpdateUnitStatus(playerId, 'rare', i, status)} onViewStats={handleViewStats} />)}
      </div>

      <UnitStatModal unit={selectedUnit} onClose={() => setSelectedUnit(null)} />
    </div>
  );
};