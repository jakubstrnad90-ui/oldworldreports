
import React, { useState } from 'react';
import { Army } from '../types';
import { FileUpload } from './FileUpload.tsx';

interface ArmyManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadFromFile: (content: string) => void;
  onLoadFromBarracks: (army: Army) => void;
  savedArmies: Army[];
  onDeleteArmy: (armyName: string) => void;
  title: string;
}

export const ArmyManagementModal: React.FC<ArmyManagementModalProps> = ({
  isOpen,
  onClose,
  onLoadFromFile,
  onLoadFromBarracks,
  savedArmies,
  onDeleteArmy,
  title
}) => {
  const [activeTab, setActiveTab] = useState<'barracks' | 'upload'>('barracks');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-amber-600/50">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="font-medieval text-2xl text-amber-400">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-2xl">&times;</button>
        </div>

        <div className="border-b border-gray-700">
          <nav className="flex space-x-4 px-4">
            <button
              onClick={() => setActiveTab('barracks')}
              className={`py-3 px-4 font-medium text-sm border-b-2 ${activeTab === 'barracks' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
            >
              Load from Barracks
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`py-3 px-4 font-medium text-sm border-b-2 ${activeTab === 'upload' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
            >
              Upload from File
            </button>
          </nav>
        </div>

        <div className="p-6 overflow-y-auto">
          {activeTab === 'upload' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-300 mb-4">Upload a .json army file from old-world-builder.com</h3>
              <FileUpload onFileUpload={onLoadFromFile} label="" />
            </div>
          )}
          {activeTab === 'barracks' && (
            <div>
              {savedArmies.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Your barracks are empty. Save an army to see it here.</p>
              ) : (
                <ul className="space-y-3">
                  {savedArmies.map((army, index) => (
                    <li key={index} className="bg-gray-700/50 p-3 rounded-md flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-amber-300">{army.name}</p>
                        <p className="text-sm text-gray-400">{army.army} - {army.points} pts</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onLoadFromBarracks(army)}
                          className="px-3 py-1 bg-green-700 text-white text-sm rounded-md hover:bg-green-600"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete "${army.name}"?`)) {
                              onDeleteArmy(army.name);
                            }
                          }}
                          className="px-3 py-1 bg-red-800 text-white text-sm rounded-md hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
