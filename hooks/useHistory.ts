
import { useData } from '../context/DataContext';

export const useHistory = () => {
  const { history, addToHistory, clearHistory, historyLoading } = useData();

  return { 
    history, 
    addToHistory, 
    clearHistory, 
    loading: historyLoading 
  };
};
