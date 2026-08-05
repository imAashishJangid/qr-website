import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

// Makes the Android hardware/gesture back button navigate the app's history
// instead of immediately exiting — only relevant when running inside the
// Capacitor native shell (no-op on the web).
const AndroidBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listenerPromise = CapacitorApp.addListener('backButton', () => {
      if (location.pathname === '/') {
        CapacitorApp.exitApp();
      } else {
        navigate(-1);
      }
    });

    return () => {
      listenerPromise.then((listener) => listener.remove());
    };
  }, [navigate, location.pathname]);

  return null;
};

export default AndroidBackButton;
