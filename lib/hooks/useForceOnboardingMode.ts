import { useState, useEffect } from 'react';

// Global flag to enable/disable forced onboarding mode
const FORCE_ONBOARDING_KEY = 'selah_force_onboarding_mode';

/**
 * Hook to enable/disable and check forced onboarding mode
 * 
 * This is a development utility to bypass authentication issues and
 * ensure the onboarding screens are shown regardless of user state
 */
export const useForceOnboardingMode = () => {
  const [isForced, setIsForced] = useState<boolean>(false);

  // Check if forced mode is enabled on mount
  useEffect(() => {
    try {
      const forcedMode = localStorage.getItem(FORCE_ONBOARDING_KEY) === 'true';
      setIsForced(forcedMode);
    } catch (error) {
      console.error('Failed to check forced onboarding mode:', error);
    }
  }, []);

  // Enable forced onboarding mode
  const enableForcedMode = () => {
    try {
      localStorage.setItem(FORCE_ONBOARDING_KEY, 'true');
      setIsForced(true);
      console.log('Forced onboarding mode ENABLED');
      return true;
    } catch (error) {
      console.error('Failed to enable forced onboarding mode:', error);
      return false;
    }
  };

  // Disable forced onboarding mode
  const disableForcedMode = () => {
    try {
      localStorage.removeItem(FORCE_ONBOARDING_KEY);
      setIsForced(false);
      console.log('Forced onboarding mode DISABLED');
      return true;
    } catch (error) {
      console.error('Failed to disable forced onboarding mode:', error);
      return false;
    }
  };

  // Check if forced mode is enabled (without state)
  const checkForcedMode = (): boolean => {
    try {
      return localStorage.getItem(FORCE_ONBOARDING_KEY) === 'true';
    } catch (error) {
      console.error('Failed to check forced onboarding mode:', error);
      return false;
    }
  };

  return {
    isForced,
    enableForcedMode,
    disableForcedMode,
    checkForcedMode
  };
}; 