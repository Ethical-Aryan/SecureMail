import React, { createContext, useReducer, useCallback, useMemo } from 'react';
import mailService from '../services/mailService';

// ==============================================================
// Mail Context & Provider
// ==============================================================

export const MailContext = createContext(null);

const MAIL_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_EMAILS: 'SET_EMAILS',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_EMAIL: 'UPDATE_EMAIL',
  DELETE_EMAIL: 'DELETE_EMAIL',
  SET_REFRESHING: 'SET_REFRESHING',
  SET_SENDING: 'SET_SENDING',
};

const initialState = {
  emails: [],
  isLoading: false,
  isRefreshing: false,
  isSending: false,
  error: null,
};

function mailReducer(state, action) {
  switch (action.type) {
    case MAIL_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload, error: null };

    case MAIL_ACTIONS.SET_EMAILS:
      return {
        ...state,
        emails: action.payload,
        isLoading: false,
        isRefreshing: false,
        error: null,
      };

    case MAIL_ACTIONS.SET_ERROR:
      return {
        ...state,
        isLoading: false,
        isRefreshing: false,
        isSending: false,
        error: action.payload,
      };

    case MAIL_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    case MAIL_ACTIONS.UPDATE_EMAIL:
      return {
        ...state,
        emails: state.emails.map((e) =>
          e.id === action.payload.id ? { ...e, ...action.payload.updates } : e
        ),
      };

    case MAIL_ACTIONS.DELETE_EMAIL:
      return {
        ...state,
        emails: state.emails.filter((e) => e.id !== action.payload),
      };

    case MAIL_ACTIONS.SET_REFRESHING:
      return { ...state, isRefreshing: action.payload };

    case MAIL_ACTIONS.SET_SENDING:
      return { ...state, isSending: action.payload };

    default:
      return state;
  }
}

export function MailProvider({ children }) {
  const [state, dispatch] = useReducer(mailReducer, initialState);

  const fetchEmails = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      dispatch({ type: MAIL_ACTIONS.SET_REFRESHING, payload: true });
    } else {
      dispatch({ type: MAIL_ACTIONS.SET_LOADING, payload: true });
    }

    try {
      const data = await mailService.getEmails();
      dispatch({ type: MAIL_ACTIONS.SET_EMAILS, payload: data });
      return { success: true, data };
    } catch (error) {
      const message = error.userMessage || 'Failed to load emails';
      dispatch({ type: MAIL_ACTIONS.SET_ERROR, payload: message });
      return { success: false, error: message };
    }
  }, []);

  const sendEmail = useCallback(async (emailData) => {
    dispatch({ type: MAIL_ACTIONS.SET_SENDING, payload: true });

    try {
      const data = await mailService.composeEmail(emailData);
      dispatch({ type: MAIL_ACTIONS.SET_SENDING, payload: false });
      // Refresh emails after sending
      fetchEmails(true);
      return { success: true, data };
    } catch (error) {
      dispatch({ type: MAIL_ACTIONS.SET_SENDING, payload: false });
      const message = error.userMessage || 'Failed to send email';
      return { success: false, error: message };
    }
  }, [fetchEmails]);

  const markAsRead = useCallback(async (emailId) => {
    try {
      await mailService.markAsRead(emailId);
      dispatch({
        type: MAIL_ACTIONS.UPDATE_EMAIL,
        payload: { id: emailId, updates: { unread: false } },
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.userMessage };
    }
  }, []);

  const toggleStar = useCallback(async (emailId, currentStarred) => {
    // Optimistic update
    dispatch({
      type: MAIL_ACTIONS.UPDATE_EMAIL,
      payload: { id: emailId, updates: { starred: !currentStarred } },
    });

    try {
      await mailService.toggleStar(emailId, currentStarred);
      return { success: true };
    } catch (error) {
      // Revert on failure
      dispatch({
        type: MAIL_ACTIONS.UPDATE_EMAIL,
        payload: { id: emailId, updates: { starred: currentStarred } },
      });
      return { success: false, error: error.userMessage };
    }
  }, []);

  const deleteEmail = useCallback(async (emailId) => {
    try {
      await mailService.deleteEmail(emailId);
      dispatch({ type: MAIL_ACTIONS.DELETE_EMAIL, payload: emailId });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.userMessage };
    }
  }, []);

  const decryptEmail = useCallback(async (emailId, passkey) => {
    try {
      const data = await mailService.decryptEmail(emailId, passkey);
      return { success: true, data };
    } catch (error) {
      const message = error.userMessage || error.response?.data?.error || 'Decryption failed';
      return { success: false, error: message };
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: MAIL_ACTIONS.CLEAR_ERROR });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      fetchEmails,
      sendEmail,
      markAsRead,
      toggleStar,
      deleteEmail,
      decryptEmail,
      clearError,
    }),
    [state, fetchEmails, sendEmail, markAsRead, toggleStar, deleteEmail, decryptEmail, clearError]
  );

  return (
    <MailContext.Provider value={value}>
      {children}
    </MailContext.Provider>
  );
}
