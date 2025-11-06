
import React from 'react';
import { ArmyUnit } from '../types';
import { Modal } from './Modal.tsx';

interface UnitStatModalProps {
  unit: ArmyUnit | null;
  onClose: () => void;
}

export const UnitStatModal: React.FC<UnitStatModalProps> = ({ unit, onClose }) => {
  if (!unit) return null;

  const renderList = (items: { name_en: string }[] | undefined, title: string) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="mt-4">
        <h4 className="font-semibold text-amber-300 mb-2">{title}</h4>
        <ul className="list-disc list-inside text-gray-400 text-sm">
          {items.map((item, index) => <li key={index}>{item.name_en}</li>)}
        </ul>
      </div>
    );
  };

  return (
    <Modal isOpen={!!unit} onClose={onClose} title={unit.name_en}>
      <div className="text-gray-300">
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-4">
          {unit.type && <p><span className="font-semibold text-gray-400">Unit Type:</span> {unit.type}</p>}
          {unit.size && <p><span className="font-semibold text-gray-400">Base Size:</span> {unit.size}</p>}
        </div>

        {unit.stats && (
          <div className="overflow-x-auto">
            <table className="w-full text-center bg-gray-900/50 rounded-lg">
              <thead className="bg-gray-700 text-amber-300 text-sm">
                <tr>
                  {Object.keys(unit.stats).map(stat => <th key={stat} className="p-2 font-medieval">{stat}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr className="text-lg">
                  {Object.values(unit.stats).map((value, index) => <td key={index} className="p-2 border-t border-gray-700">{value === null ? '-' : value}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {renderList(unit.equipment, 'Equipment')}
        {renderList(unit.special_rules, 'Special Rules')}

        {!unit.stats && !unit.equipment && !unit.special_rules && (
            <p className="text-gray-500 italic text-center py-4">No detailed stats available for this unit.</p>
        )}
      </div>
    </Modal>
  );
};
