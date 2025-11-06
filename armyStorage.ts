import { Army } from '../types';

const STORAGE_KEY = 'warhammer_saved_armies';

export const getSavedArmies = (): Army[] => {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Failed to retrieve saved armies from local storage:", error);
    return [];
  }
};

export const saveArmy = (armyToSave: Army): { success: boolean, message: string } => {
  if (!armyToSave || !armyToSave.name) {
    return { success: false, message: "Cannot save an army without a name." };
  }
  try {
    const armies = getSavedArmies();
    const existingIndex = armies.findIndex(army => army.name === armyToSave.name);
    let message: string;

    if (existingIndex !== -1) {
      armies[existingIndex] = armyToSave;
      message = `Army "${armyToSave.name}" has been updated in the Barracks.`;
    } else {
      armies.push(armyToSave);
      message = `Army "${armyToSave.name}" saved to the Barracks.`;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(armies));
    return { success: true, message };
  } catch (error) {
    console.error("Failed to save army to local storage:", error);
    return { success: false, message: "An error occurred while saving the army." };
  }
};

export const deleteArmy = (armyName: string): void => {
  try {
    let armies = getSavedArmies();
    armies = armies.filter(army => army.name !== armyName);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(armies));
  } catch (error) {
    console.error("Failed to delete army from local storage:", error);
  }
};
