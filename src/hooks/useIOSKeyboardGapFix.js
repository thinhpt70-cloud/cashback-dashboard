import { useEffect } from 'react';

/**
 * A custom React hook to fix the visual gap left by the virtual keyboard on iOS devices.
 * When an input element loses focus and the keyboard is about to hide, this hook
 * programmatically scrolls the window to the top to eliminate the empty space.
 */
function useIOSKeyboardGapFix() {
  useEffect(() => {
    // This fix is only necessary for iOS devices.
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (!isIOS) return;

    const handleBlur = (event) => {
      const elementLosingFocus = event.target;
      const elementGainingFocus = event.relatedTarget;

      // 1. First, check if the element losing focus is an input-type element.
      //    If not, the keyboard wasn't open, so we do nothing.
      if (!elementLosingFocus || !['INPUT', 'SELECT', 'TEXTAREA'].includes(elementLosingFocus.tagName)) {
        return;
      }

      // 2. Second, check if focus is simply moving to another input.
      //    If so, the keyboard is staying open, and we shouldn't scroll.
      if (elementGainingFocus && ['INPUT', 'SELECT', 'TEXTAREA'].includes(elementGainingFocus.tagName)) {
        return;
      }
      
      // 3. If an input has lost focus to a non-input element,
      //    it means the keyboard is closing. We can now safely scroll to the top.
      //    A small timeout helps ensure the keyboard has begun its closing animation.
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 100);
    };

    // Use event capturing (the third argument `true`) to catch the blur event
    // early in its propagation.
    window.addEventListener('blur', handleBlur, true);

    // Cleanup function to remove the event listener when the component unmounts.
    return () => {
      window.removeEventListener('blur', handleBlur, true);
    };
  }, []); // The empty dependency array ensures this effect runs only once.
}

export default useIOSKeyboardGapFix;