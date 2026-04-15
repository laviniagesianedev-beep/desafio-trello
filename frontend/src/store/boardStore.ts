import { create } from 'zustand';

interface Board {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  background: string;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  members_count?: number;
  lists_count?: number;
  cards_count?: number;
  members?: any[];
  owner?: any;
}

interface BoardState {
  boards: {
    owned: Board[];
    member: Board[];
  };
  currentBoard: Board | null;
  isLoading: boolean;
  error: string | null;
  
  // Ações
  setBoards: (boards: { owned: Board[]; member: Board[] }) => void;
  setCurrentBoard: (board: Board | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addBoard: (board: Board) => void;
  updateBoard: (id: number, data: Partial<Board>) => void;
  removeBoard: (id: number) => void;
  clearError: () => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  boards: {
    owned: [],
    member: [],
  },
  currentBoard: null,
  isLoading: false,
  error: null,
  
  setBoards: (boards) => set({ boards }),
  setCurrentBoard: (board) => set({ currentBoard: board }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  
  addBoard: (board) => set((state) => ({
    boards: {
      ...state.boards,
      owned: [...state.boards.owned, board],
    },
  })),
  
  updateBoard: (id, data) => set((state) => {
    const updateList = (list: Board[]) => 
      list.map(b => b.id === id ? { ...b, ...data } : b);
    
    return {
      boards: {
        owned: updateList(state.boards.owned),
        member: updateList(state.boards.member),
      },
      currentBoard: state.currentBoard?.id === id 
        ? { ...state.currentBoard, ...data } 
        : state.currentBoard,
    };
  }),
  
  removeBoard: (id) => set((state) => ({
    boards: {
      owned: state.boards.owned.filter(b => b.id !== id),
      member: state.boards.member.filter(b => b.id !== id),
    },
    currentBoard: state.currentBoard?.id === id ? null : state.currentBoard,
  })),
  
  clearError: () => set({ error: null }),
}));