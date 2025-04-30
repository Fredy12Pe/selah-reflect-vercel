import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';

// FIXED: This is the EXACT key format used in components
// There's no underscore - it's just 'selah_onboarding_completed' + userId
export const useOnboarding = (user: User | null) => {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Reset state if user is null
    if (!user) {
      console.log("useOnboarding: No user, resetting state");
      setHasCompletedOnboarding(null);
      setLoading(false);
      return;
    }

    // Get the userId for storing user-specific onboarding state
    const userId = user.uid;
    
    // FIXED: Use only one key format - the one used in components
    const onboardingKey = `selah_onboarding_completed_${userId}`;
    console.log(`useOnboarding checking key: ${onboardingKey}`);

    try {
      // Check if the user has completed onboarding
      const onboardingValue = localStorage.getItem(onboardingKey);
      console.log(`useOnboarding: Current value:`, { 
        key: onboardingKey,
        value: onboardingValue 
      });
      
      // CRITICAL: For first-time users in development mode, always force to false
      if (onboardingValue === null && process.env.NODE_ENV !== 'production') {
        console.log("useOnboarding: First-time login detected - forcing to false");
        localStorage.setItem(onboardingKey, 'false');
        setHasCompletedOnboarding(false);
        setLoading(false);
        return;
      }
      
      // For general case: If null, it's a first-time user
      if (onboardingValue === null) {
        console.log(`useOnboarding: First-time user - setting false`);
        localStorage.setItem(onboardingKey, 'false');
        setHasCompletedOnboarding(false);
      } 
      // If 'true', user has completed onboarding
      else if (onboardingValue === 'true') {
        console.log(`useOnboarding: User has completed onboarding`);
        setHasCompletedOnboarding(true);
      } 
      // Any other value (like 'false'), user has not completed onboarding
      else {
        console.log(`useOnboarding: User has not completed onboarding`);
        setHasCompletedOnboarding(false);
      }
    } catch (error) {
      console.error('useOnboarding: Error checking status:', error);
      // Default to null/unknown rather than true to prevent skipping onboarding
      setHasCompletedOnboarding(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Function to mark onboarding as completed
  const completeOnboarding = () => {
    if (!user) {
      console.warn('useOnboarding: Cannot complete onboarding without a user');
      return;
    }
    
    try {
      const userId = user.uid;
      const onboardingKey = `selah_onboarding_completed_${userId}`;
      
      console.log(`useOnboarding: Marking onboarding as completed`);
      localStorage.setItem(onboardingKey, 'true');
      
      // Verify it was set
      const newValue = localStorage.getItem(onboardingKey);
      console.log(`useOnboarding: Set completed status:`, {
        key: onboardingKey,
        value: newValue,
        success: newValue === 'true'
      });
      
      setHasCompletedOnboarding(true);
    } catch (error) {
      console.error('useOnboarding: Failed to save completion:', error);
      throw new Error('Failed to save onboarding completion status');
    }
  };

  // Reset onboarding status (for debugging)
  const resetOnboarding = () => {
    if (!user) return;
    
    try {
      const userId = user.uid;
      const onboardingKey = `selah_onboarding_completed_${userId}`;
      
      // Set to false (don't remove, set explicitly to false)
      localStorage.setItem(onboardingKey, 'false');
      
      console.log(`useOnboarding: Reset onboarding status:`, {
        key: onboardingKey,
        value: 'false'
      });
      
      setHasCompletedOnboarding(false);
    } catch (error) {
      console.error('useOnboarding: Failed to reset status:', error);
    }
  };

  return {
    hasCompletedOnboarding,
    loading,
    completeOnboarding,
    resetOnboarding
  };
}; 