import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';

// Key for storing onboarding completion state in localStorage
const ONBOARDING_COMPLETED_KEY = 'selah_onboarding_completed';

export const useOnboarding = (user: User | null) => {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setHasCompletedOnboarding(null);
      setLoading(false);
      return;
    }

    // Get the userId for storing user-specific onboarding state
    const userId = user.uid;
    const userOnboardingKey = `${ONBOARDING_COMPLETED_KEY}_${userId}`;

    try {
      // Check if the user has completed onboarding
      const onboardingCompleted = localStorage.getItem(userOnboardingKey);
      
      // If we have a record, the user has completed onboarding
      setHasCompletedOnboarding(onboardingCompleted === 'true');
    } catch (error) {
      // In case of errors (e.g., localStorage not available), default to true to avoid blocking users
      console.error('Failed to check onboarding status:', error);
      setHasCompletedOnboarding(true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Function to mark onboarding as completed
  const completeOnboarding = () => {
    if (!user) return;
    
    try {
      const userId = user.uid;
      const userOnboardingKey = `${ONBOARDING_COMPLETED_KEY}_${userId}`;
      
      // Store the completion state in localStorage
      localStorage.setItem(userOnboardingKey, 'true');
      setHasCompletedOnboarding(true);
    } catch (error) {
      console.error('Failed to save onboarding completion:', error);
    }
  };

  return {
    hasCompletedOnboarding,
    loading,
    completeOnboarding
  };
}; 