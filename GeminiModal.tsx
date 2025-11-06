
import React, { useState, useEffect } from 'react';
import { GameState, GeminiRequestType } from '../types';
import { generateGeminiContent } from '../services/geminiService';
import { Modal } from './Modal';

interface GeminiModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  requestType: GeminiRequestType | null;
  playerPerspective?: 'player1' | 'player2';
}

export const GeminiModal: React.FC<GeminiModalProps> = ({ isOpen, onClose, gameState, requestType, playerPerspective }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [query, setQuery] = useState('');

  const generateTitle = () => {
    switch (requestType) {
      case GeminiRequestType.BATTLE_REPORT: return 'AI Battle Report';
      case GeminiRequestType.GENERAL_STORY: return "General's Chronicle";
      case GeminiRequestType.RULES_QUERY: return 'AI Rules Assistant';
      default: return 'Gemini AI';
    }
  };
  
  const handleGenerate = async () => {
    if (!requestType) return;
    setIsLoading(true);
    setResponse('');
    try {
      const result = await generateGeminiContent(requestType, gameState, { player: playerPerspective, query: query });
      setResponse(result);
    } catch (e) {
      setResponse('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && (requestType === GeminiRequestType.BATTLE_REPORT || requestType === GeminiRequestType.GENERAL_STORY)) {
      handleGenerate();
    }
    // Reset state when modal is closed or requestType changes
    if(!isOpen) {
        setResponse('');
        setQuery('');
        setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, requestType, playerPerspective]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={generateTitle()}>
      {requestType === GeminiRequestType.RULES_QUERY && (
        <div className="mb-4">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about a rule, phase, or unit ability..."
            className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-amber-500 focus:border-amber-500 text-gray-200"
            rows={3}
          />
          <button
            onClick={handleGenerate}
            disabled={isLoading || !query}
            className="mt-2 px-4 py-2 bg-amber-700 text-white rounded-md hover:bg-amber-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Thinking...' : 'Ask Gemini'}
          </button>
        </div>
      )}
      
      {isLoading && <div className="text-center p-8 text-gray-400">Generating response...</div>}
      
      {response && (
        <div>
          {requestType === GeminiRequestType.BATTLE_REPORT && Object.keys(gameState.turnPhotos).length > 0 && (
            <div className="mb-6">
              <h3 className="font-medieval text-xl text-amber-300 mb-2">Battlefield Imagery</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(gameState.turnPhotos).map(([turn, src]) => (
                  <div key={turn} className="group relative">
                    <img src={src} alt={`Battle view from turn ${turn}`} className="rounded-lg object-cover w-full h-full" />
                    <div className="absolute bottom-0 left-0 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-tr-lg rounded-bl-lg">
                      Turn {turn}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="prose prose-invert max-w-none prose-p:text-gray-300 prose-headings:text-amber-300 whitespace-pre-wrap">
            {response}
          </div>
        </div>
      )}
    </Modal>
  );
};