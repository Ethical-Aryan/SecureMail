import { useContext } from 'react';
import { MailContext } from '../context/MailContext';

export default function useMail() {
  const context = useContext(MailContext);
  if (!context) {
    throw new Error('useMail must be used within a MailProvider');
  }
  return context;
}
