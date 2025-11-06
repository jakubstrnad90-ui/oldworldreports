
import React, { useState, useCallback, useEffect } from 'react';
import { Army, GameState, PlayerState, BattleEvent, GeminiRequestType, GamePhase, UnitStatus, UnitReference } from './types';
import { ArmyPanel } from './components/ArmyPanel';
import { GeminiModal } from './components/GeminiModal';
import { ArmyManagementModal } from './components/ArmyManagementModal';
import * as armyStorage from './services/armyStorage';
import { FileUpload } from './components/FileUpload';


const initialPlayerState: PlayerState = {
  army: null,
  victoryPoints: 0,
};

const initialGameState: GameState = {
  player1: initialPlayerState,
  player2: initialPlayerState,
  battleLog: [],
  currentTurn: 1,
  turnPhotos: {},
};

const Header: React.FC<{ onNewGame: () => void; onSaveGame: () => void; onLoadGame: (content: string) => void }> = ({ onNewGame, onSaveGame, onLoadGame }) => (
    <header className="bg-gray-900/80 backdrop-blur-sm p-4 mb-4 rounded-lg shadow-lg border border-gray-700 flex justify-between items-center sticky top-4 z-10">
      <h1 className="font-medieval text-4xl text-amber-500">Battle Chronicler</h1>
      <div className="flex items-center gap-4">
        <button onClick={onNewGame} className="px-4 py-2 bg-red-800 text-white rounded-md hover:bg-red-700 transition-colors">New Battle</button>
        <button onClick={onSaveGame} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors">Save Battle</button>
        <FileUpload onFileUpload={onLoadGame} label="Load Battle"/>
      </div>
    </header>
);

const VictoryPointTracker: React.FC<{ vp: number; setVp: (vp: number) => void }> = ({ vp, setVp }) => (
  <div className="flex items-center gap-2 bg-gray-900/50 p-2 rounded-lg">
    <button onClick={() => setVp(vp - 1)} className="w-8 h-8 bg-red-700 rounded">-</button>
    <span className="text-xl font-bold w-12 text-center text-amber-300">{vp}</span>
    <button onClick={() => setVp(vp + 1)} className="w-8 h-8 bg-green-700 rounded">+</button>
  </div>
);

const BattleLog: React.FC<{ 
    log: BattleEvent[]; 
    addEvent: (eventData: Omit<BattleEvent, 'id' | 'turn'>) => void; 
    removeEvent: (id: string) => void;
    currentTurn: number;
    gameState: GameState;
}> = ({ log, addEvent, removeEvent, currentTurn, gameState }) => {
    const [description, setDescription] = useState('');
    const [selectedPlayer, setSelectedPlayer] = useState<'player1' | 'player2'>('player1');
    const [selectedPhase, setSelectedPhase] = useState<GamePhase>(GamePhase.START_OF_TURN);
    const [actingUnitRef, setActingUnitRef] = useState<string>('none');
    const [targetUnitRef, setTargetUnitRef] = useState<string>('none');

    const getUnitsForPlayer = useCallback((playerState: PlayerState, playerId: 'player1' | 'player2') => {
        if (!playerState.army) return [];
        const army = playerState.army;
        const allUnits: {label: string, value: string}[] = [];
        
        (['characters', 'core', 'special', 'rare'] as const).forEach(unitType => {
            army[unitType].forEach((unit, index) => {
                allUnits.push({
                    label: `(${unitType.charAt(0).toUpperCase()}) ${unit.name_en}`,
                    value: JSON.stringify({
                        playerId,
                        unitType,
                        unitIndex: index,
                        unitName: unit.name_en,
                    } as UnitReference)
                });
            });
        });
        return allUnits;
    }, []);

    useEffect(() => {
        setActingUnitRef('none');
        setTargetUnitRef('none');
    }, [selectedPlayer]);

    const handleAdd = () => {
        if (description.trim()) {
            addEvent({
                description,
                playerId: selectedPlayer,
                phase: selectedPhase,
                actingUnit: actingUnitRef !== 'none' ? JSON.parse(actingUnitRef) : undefined,
                targetUnit: targetUnitRef !== 'none' ? JSON.parse(targetUnitRef) : undefined,
            });
            setDescription('');
            setActingUnitRef('none');
            setTargetUnitRef('none');
        }
    };
    
    const phases = Object.values(GamePhase);
    const currentTurnEvents = log.filter(e => e.turn === currentTurn);
    const p1Name = gameState.player1.army?.name || 'Player 1';
    const p2Name = gameState.player2.army?.name || 'Player 2';

    const actingPlayerUnits = getUnitsForPlayer(gameState[selectedPlayer], selectedPlayer);
    const targetPlayerId = selectedPlayer === 'player1' ? 'player2' : 'player1';
    const targetPlayerUnits = getUnitsForPlayer(gameState[targetPlayerId], targetPlayerId);

    const formatEventDescription = (event: BattleEvent) => {
        let prefix = '';
        if (event.actingUnit) {
            prefix = `${event.actingUnit.unitName}: `;
        }
        let suffix = '';
        if (event.targetUnit) {
            suffix = ` (vs ${event.targetUnit.unitName})`;
        }
        return `${prefix}${event.description}${suffix}`;
    };

    return (
        <div className="bg-gray-800/50 p-4 rounded-lg shadow-xl border border-gray-700 h-full flex flex-col">
            <h3 className="font-medieval text-2xl text-amber-400 mb-4 text-center">Battle Log - Turn {currentTurn}</h3>
            
            <div className="flex-grow overflow-y-auto mb-4 grid grid-cols-2 gap-4 pr-2">
                {[
                    { id: 'player1', name: p1Name, events: currentTurnEvents.filter(e => e.playerId === 'player1') },
                    { id: 'player2', name: p2Name, events: currentTurnEvents.filter(e => e.playerId === 'player2') }
                ].map(player => (
                    <div key={player.id}>
                        <h4 className="font-medieval text-xl text-amber-300 border-b border-gray-600 pb-1 mb-2">{player.name}</h4>
                        {player.events.length === 0 ? <p className="text-gray-500 text-sm italic">No events this turn.</p> : (
                            phases.map(phase => {
                                const phaseEvents = player.events.filter(e => e.phase === phase);
                                if (phaseEvents.length === 0) return null;
                                return (
                                    <div key={phase} className="mb-3">
                                        <h5 className="font-semibold text-gray-400 text-sm">{phase}</h5>
                                        {phaseEvents.map(event => (
                                            <div key={event.id} className="bg-gray-700/50 p-2 rounded mt-1 flex justify-between items-start">
                                                <p className="text-sm text-gray-300">{formatEventDescription(event)}</p>
                                                <button onClick={() => removeEvent(event.id)} className="text-red-500 hover:text-red-400 text-xs ml-2 font-bold flex-shrink-0">X</button>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })
                        )}
                    </div>
                ))}
            </div>
            
            <div className="border-t border-gray-600 pt-3 space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>
                        <label className="text-xs text-gray-400 block mb-1">Player</label>
                        <div className="flex gap-2 rounded-md bg-gray-900 p-1">
                            <button onClick={() => setSelectedPlayer('player1')} className={`flex-1 text-sm py-1 rounded transition-colors ${selectedPlayer === 'player1' ? 'bg-amber-700 text-white' : 'bg-transparent text-gray-300 hover:bg-gray-700'}`}>{p1Name}</button>
                            <button onClick={() => setSelectedPlayer('player2')} className={`flex-1 text-sm py-1 rounded transition-colors ${selectedPlayer === 'player2' ? 'bg-amber-700 text-white' : 'bg-transparent text-gray-300 hover:bg-gray-700'}`}>{p2Name}</button>
                        </div>
                    </div>
                    <div className="col-span-2">
                        <label htmlFor="phase-select" className="text-xs text-gray-400 block mb-1">Game Phase</label>
                        <select
                            id="phase-select"
                            value={selectedPhase}
                            onChange={e => setSelectedPhase(e.target.value as GamePhase)}
                            className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-amber-500 focus:border-amber-500 text-sm"
                        >
                            {phases.map(phase => <option key={phase} value={phase}>{phase}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                        <label htmlFor="acting-unit-select" className="text-xs text-gray-400 block mb-1">Acting Unit (Optional)</label>
                        <select
                            id="acting-unit-select"
                            value={actingUnitRef}
                            onChange={e => setActingUnitRef(e.target.value)}
                            className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-amber-500 focus:border-amber-500 text-sm"
                        >
                            <option value="none">-- None --</option>
                            {actingPlayerUnits.map(unit => <option key={unit.value} value={unit.value}>{unit.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="target-unit-select" className="text-xs text-gray-400 block mb-1">Target Unit (Optional)</label>
                        <select
                            id="target-unit-select"
                            value={targetUnitRef}
                            onChange={e => setTargetUnitRef(e.target.value)}
                            className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-amber-500 focus:border-amber-500 text-sm"
                        >
                            <option value="none">-- None --</option>
                            {targetPlayerUnits.map(unit => <option key={unit.value} value={unit.value}>{unit.label}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAdd()}
                        placeholder="Event description... (e.g., 'Charged', 'Shot at', 'Cast a spell')"
                        className="flex-grow p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-amber-500 focus:border-amber-500 text-sm"
                    />
                    <button
                        onClick={handleAdd}
                        className="px-4 py-2 bg-amber-700 text-white rounded-md hover:bg-amber-600 disabled:bg-gray-600 transition-colors"
                        disabled={!description.trim()}
                    >
                        Add Event
                    </button>
                </div>
            </div>
        </div>
    );
};

const TurnControls: React.FC<{
    currentTurn: number;
    setCurrentTurn: (turn: number) => void;
    onAddPhoto: (turn: number, dataUrl: string) => void;
}> = ({ currentTurn, setCurrentTurn, onAddPhoto }) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                onAddPhoto(currentTurn, dataUrl);
            };
            reader.readAsDataURL(file);
        }
        event.target.value = '';
    };

    return (
        <div className="bg-gray-800/50 p-4 rounded-lg shadow-xl border border-gray-700 flex justify-center items-center gap-6">
            <button onClick={() => setCurrentTurn(Math.max(1, currentTurn - 1))} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">&lt; Prev Turn</button>
            <div className="text-center">
                <span className="font-medieval text-3xl text-amber-300">Turn {currentTurn}</span>
                <div className="mt-2">
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="text-xs text-amber-400 hover:text-amber-300 underline">Add Turn Photo</button>
                </div>
            </div>
            <button onClick={() => setCurrentTurn(currentTurn + 1)} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Next Turn &gt;</button>
        </div>
    );
}

const GeminiControls: React.FC<{
    onOpenModal: (type: GeminiRequestType, player?: 'player1' | 'player2') => void;
}> = ({ onOpenModal }) => (
    <div className="bg-gray-800/50 p-4 rounded-lg shadow-xl border border-gray-700 flex flex-col items-center gap-3">
        <h3 className="font-medieval text-2xl text-amber-400">Gemini AI Suite</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
            <button onClick={() => onOpenModal(GeminiRequestType.BATTLE_REPORT)} className="w-full px-4 py-2 bg-amber-800 text-white rounded-md hover:bg-amber-700 transition-colors">Generate Battle Report</button>
            <button onClick={() => onOpenModal(GeminiRequestType.GENERAL_STORY, 'player1')} className="w-full px-4 py-2 bg-sky-800 text-white rounded-md hover:bg-sky-700 transition-colors">P1 General's Story</button>
            <button onClick={() => onOpenModal(GeminiRequestType.GENERAL_STORY, 'player2')} className="w-full px-4 py-2 bg-sky-800 text-white rounded-md hover:bg-sky-700 transition-colors">P2 General's Story</button>
            <button onClick={() => onOpenModal(GeminiRequestType.RULES_QUERY)} className="col-span-1 sm:col-span-2 lg:col-span-3 w-full px-4 py-2 bg-indigo-800 text-white rounded-md hover:bg-indigo-700 transition-colors">Ask Rules Assistant</button>
        </div>
    </div>
);


const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [isGeminiModalOpen, setIsGeminiModalOpen] = useState(false);
  const [geminiRequest, setGeminiRequest] = useState<{type: GeminiRequestType | null, player?: 'player1' | 'player2'}>({type: null});
  const [isArmyModalOpen, setIsArmyModalOpen] = useState(false);
  const [armyModalPlayer, setArmyModalPlayer] = useState<'player1' | 'player2'>('player1');
  const [savedArmies, setSavedArmies] = useState<Army[]>(armyStorage.getSavedArmies());

  const handleFileUpload = (content: string, player: 'player1' | 'player2') => {
    try {
      const parsedArmy: Army = JSON.parse(content);
      // Initialize unit statuses
      const initializeStatus = (unit: any) => ({ ...unit, status: UnitStatus.READY });
      parsedArmy.characters = parsedArmy.characters.map(initializeStatus);
      parsedArmy.core = parsedArmy.core.map(initializeStatus);
      parsedArmy.special = parsedArmy.special.map(initializeStatus);
      parsedArmy.rare = parsedArmy.rare.map(initializeStatus);
      
      setGameState(prev => ({
        ...prev,
        [player]: { ...prev[player], army: parsedArmy },
      }));
      setIsArmyModalOpen(false);
    } catch (error) {
      console.error("Failed to parse army file:", error);
      alert("Invalid army file format.");
    }
  };

  const setPlayerVictoryPoints = (player: 'player1' | 'player2', vp: number) => {
    setGameState(prev => ({
      ...prev,
      [player]: { ...prev[player], victoryPoints: Math.max(0, vp) },
    }));
  };

  const addBattleEvent = (eventData: Omit<BattleEvent, 'id' | 'turn'>) => {
    const newEvent: BattleEvent = {
        ...eventData,
        id: new Date().toISOString() + Math.random(),
        turn: gameState.currentTurn,
    };
    setGameState(prev => ({
        ...prev,
        battleLog: [...prev.battleLog, newEvent],
    }));
  };
  
  const removeBattleEvent = (id: string) => {
    setGameState(prev => ({
        ...prev,
        battleLog: prev.battleLog.filter(event => event.id !== id),
    }));
  };
  
  const setCurrentTurn = (turn: number) => {
    setGameState(prev => ({ ...prev, currentTurn: turn }));
  };

  const addTurnPhoto = (turn: number, dataUrl: string) => {
    setGameState(prev => ({
        ...prev,
        turnPhotos: {...prev.turnPhotos, [turn]: dataUrl }
    }));
  };

  const openGeminiModal = (type: GeminiRequestType, player?: 'player1' | 'player2') => {
    setGeminiRequest({ type, player });
    setIsGeminiModalOpen(true);
  };
  
  const updateUnitStatus = (
    playerId: 'player1' | 'player2',
    unitType: 'characters' | 'core' | 'special' | 'rare',
    unitIndex: number,
    status: UnitStatus
  ) => {
    setGameState(prev => {
        const newState = { ...prev };
        const playerState = newState[playerId];
        if (playerState.army) {
            const army = { ...playerState.army };
            const unitSection = [...army[unitType]];
            unitSection[unitIndex] = { ...unitSection[unitIndex], status: status };
            army[unitType] = unitSection;
            newState[playerId] = { ...playerState, army };
        }
        return newState;
    });
  };

  const handleSaveArmy = (player: 'player1' | 'player2') => {
      const army = gameState[player].army;
      if (army) {
        const { success, message } = armyStorage.saveArmy(army);
        alert(message);
        if (success) {
            setSavedArmies(armyStorage.getSavedArmies());
        }
      } else {
        alert("No army to save for this player.");
      }
  };

  const handleDeleteArmy = (armyName: string) => {
      armyStorage.deleteArmy(armyName);
      setSavedArmies(armyStorage.getSavedArmies());
  };
  
  const handleLoadFromBarracks = (army: Army, player: 'player1' | 'player2') => {
    const armyWithStatus = JSON.parse(JSON.stringify(army)); // deep copy
    const initializeStatus = (unit: any) => ({ ...unit, status: UnitStatus.READY });
    armyWithStatus.characters = armyWithStatus.characters.map(initializeStatus);
    armyWithStatus.core = armyWithStatus.core.map(initializeStatus);
    armyWithStatus.special = armyWithStatus.special.map(initializeStatus);
    armyWithStatus.rare = armyWithStatus.rare.map(initializeStatus);

    setGameState(prev => ({
      ...prev,
      [player]: { ...prev[player], army: armyWithStatus },
    }));
    setIsArmyModalOpen(false);
  };

  const newGame = () => {
    if (window.confirm("Are you sure you want to start a new battle? All unsaved progress will be lost.")) {
      setGameState(initialGameState);
    }
  }

  const saveGame = () => {
    const gameStateString = JSON.stringify(gameState);
    const blob = new Blob([gameStateString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `battle-chronicler-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadGame = (content: string) => {
     try {
      const loadedState: GameState = JSON.parse(content);
      // Data validation could be added here
      setGameState(loadedState);
    } catch (error) {
      console.error("Failed to parse game state file:", error);
      alert("Invalid game state file format.");
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
        <Header onNewGame={newGame} onSaveGame={saveGame} onLoadGame={loadGame} />
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Player 1 Panel */}
            <div className="lg:col-span-3">
                <div className="flex justify-between items-center mb-2">
                    <button onClick={() => { setIsArmyModalOpen(true); setArmyModalPlayer('player1'); }} className="px-3 py-1 bg-amber-700 text-white text-sm rounded-md hover:bg-amber-600 transition-colors">Manage Army</button>
                    <VictoryPointTracker vp={gameState.player1.victoryPoints} setVp={(vp) => setPlayerVictoryPoints('player1', vp)} />
                </div>
                <ArmyPanel playerState={gameState.player1} title="Player 1" playerId="player1" onUpdateUnitStatus={updateUnitStatus} onSaveArmy={() => handleSaveArmy('player1')} />
            </div>

            {/* Center Column */}
            <div className="lg:col-span-6 flex flex-col gap-4">
                <TurnControls currentTurn={gameState.currentTurn} setCurrentTurn={setCurrentTurn} onAddPhoto={addTurnPhoto} />
                <div className="flex-grow h-[60vh] lg:h-auto">
                    <BattleLog log={gameState.battleLog} addEvent={addBattleEvent} removeEvent={removeBattleEvent} currentTurn={gameState.currentTurn} gameState={gameState} />
                </div>
                <GeminiControls onOpenModal={openGeminiModal} />
            </div>

            {/* Player 2 Panel */}
            <div className="lg:col-span-3">
                 <div className="flex justify-between items-center mb-2">
                    <button onClick={() => { setIsArmyModalOpen(true); setArmyModalPlayer('player2'); }} className="px-3 py-1 bg-amber-700 text-white text-sm rounded-md hover:bg-amber-600 transition-colors">Manage Army</button>
                    <VictoryPointTracker vp={gameState.player2.victoryPoints} setVp={(vp) => setPlayerVictoryPoints('player2', vp)} />
                </div>
                <ArmyPanel playerState={gameState.player2} title="Player 2" playerId="player2" onUpdateUnitStatus={updateUnitStatus} onSaveArmy={() => handleSaveArmy('player2')} />
            </div>
        </main>

        <GeminiModal
          isOpen={isGeminiModalOpen}
          onClose={() => setIsGeminiModalOpen(false)}
          gameState={gameState}
          requestType={geminiRequest.type}
          playerPerspective={geminiRequest.player}
        />

        <ArmyManagementModal
          isOpen={isArmyModalOpen}
          onClose={() => setIsArmyModalOpen(false)}
          title={`Manage Army for ${armyModalPlayer === 'player1' ? (gameState.player1.army?.name || 'Player 1') : (gameState.player2.army?.name || 'Player 2')}`}
          onLoadFromFile={(content) => handleFileUpload(content, armyModalPlayer)}
          onLoadFromBarracks={(army) => handleLoadFromBarracks(army, armyModalPlayer)}
          savedArmies={savedArmies}
          onDeleteArmy={handleDeleteArmy}
        />
    </div>
  );
};

export default App;
