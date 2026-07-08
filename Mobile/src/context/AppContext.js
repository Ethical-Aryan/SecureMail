import React, { createContext, useReducer, useCallback, useMemo } from 'react';

// ==============================================================
// App Context — Global state (theme, toasts, network)
// ==============================================================

export const AppContext = createContext(null);

const APP_ACTIONS = {
  SET_THEME: 'SET_THEME',
  ADD_TOAST: 'ADD_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
  SET_NETWORK: 'SET_NETWORK',
};

const initialState = {
  themeMode: 'light', // 'light' | 'dark'
  toasts: [],
  isOnline: true,
};

function appReducer(state, action) {
  switch (action.type) {
    case APP_ACTIONS.SET_THEME:
      return { ...state, themeMode: action.payload };

    case APP_ACTIONS.ADD_TOAST:
      return {
        ...state,
        toasts: [...state.toasts, action.payload],
      };

    case APP_ACTIONS.REMOVE_TOAST:
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.payload),
      };

    case APP_ACTIONS.SET_NETWORK:
      return { ...state, isOnline: action.payload };

    default:
      return state;
  }
}

let toastId = 0;

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const setTheme = useCallback((mode) => {
    dispatch({ type: APP_ACTIONS.SET_THEME, payload: mode });
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = ++toastId;
    dispatch({
      type: APP_ACTIONS.ADD_TOAST,
      payload: { id, message, type, duration },
    });

    setTimeout(() => {
      dispatch({ type: APP_ACTIONS.REMOVE_TOAST, payload: id });
    }, duration);

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    dispatch({ type: APP_ACTIONS.REMOVE_TOAST, payload: id });
  }, []);

  const setNetworkStatus = useCallback((isOnline) => {
    dispatch({ type: APP_ACTIONS.SET_NETWORK, payload: isOnline });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      setTheme,
      showToast,
      removeToast,
      setNetworkStatus,
    }),
    [state, setTheme, showToast, removeToast, setNetworkStatus]
  );

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}
