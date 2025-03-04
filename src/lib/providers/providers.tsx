'use client';

import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '../store/store';
import { supabase } from '../supabase';
import { setUser } from '../store/slices/authSlice';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Set up Supabase auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        store.dispatch(setUser(session.user));
      } else {
        store.dispatch(setUser(null));
      }
    });

    // Initial session check
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        store.dispatch(setUser(session.user));
      }
    };
    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
  <Provider store={store}>
    {children}
    <ToastContainer position="bottom-right" autoClose={3000} />
  </Provider>
);
}