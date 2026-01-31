
import { useData } from '../context/DataContext';

export const useHistory = () => {
  const { history, addToHistory, removeFromHistory, clearHistory, historyLoading } = useData();

  return { 
    history, 
    addToHistory, 
    removeFromHistory,
    clearHistory, 
    loading: historyLoading 
  };
};
