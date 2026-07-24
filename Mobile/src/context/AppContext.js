import React, { createContext, useReducer, useCallback, useMemo } from 'react';

// ==============================================================
// App Context — Global state (toasts, network, unread notifications)
// ==============================================================

export const AppContext = createContext(null);

const APP_ACTIONS = {
  ADD_TOAST: 'ADD_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
  SET_NETWORK: 'SET_NETWORK',
  SET_UNREAD_NOTIFICATIONS: 'SET_UNREAD_NOTIFICATIONS',
};

const initialState = {
  toasts: [],
  isOnline: true,
  unreadNotificationsCount: 0,
};

function appReducer(state, action) {
  switch (action.type) {
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

    case APP_ACTIONS.SET_UNREAD_NOTIFICATIONS:
      return { ...state, unreadNotificationsCount: action.payload };

    default:
      return state;
  }
}

let toastId = 0;

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

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

  const setUnreadNotificationsCount = useCallback((count) => {
    dispatch({ type: APP_ACTIONS.SET_UNREAD_NOTIFICATIONS, payload: count });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      showToast,
      removeToast,
      setNetworkStatus,
      setUnreadNotificationsCount,
    }),
    [state, showToast, removeToast, setNetworkStatus, setUnreadNotificationsCount]
  );

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}
