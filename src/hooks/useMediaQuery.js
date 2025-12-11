import { useState, useEffect } from 'react';

/**
 * A custom React hook that tracks the state of a CSS media query.
 * @param {string} query - The media query string to watch (e.g., "(min-width: 768px)").
 * @returns {boolean} - Returns true if the media query matches, otherwise false.
 */
const useMediaQuery = (query) => {
    // State to store whether the media query matches or not.
    // Initialize with a safe default if window is undefined
    const getMatches = (query) => {
        if (typeof window !== 'undefined' && window.matchMedia) {
            const mql = window.matchMedia(query);
            return mql && mql.matches;
        }
        return false;
    }

    const [matches, setMatches] = useState(() => getMatches(query));

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;

        // Create a MediaQueryList object.
        const media = window.matchMedia(query);

        // Safety check if matchMedia returned null/undefined (e.g. bad mock)
        if (!media) return;

        // Update the state with the initial value on mount.
        if (media.matches !== matches) {
            setMatches(media.matches);
        }

        // Create a listener function to update the state on change.
        const listener = () => {
            setMatches(media.matches);
        };

        // Add the listener for changes to the media query state.
        // Support both addEventListener (modern) and addListener (deprecated but common in older browsers/mocks)
        if (media.addEventListener) {
            media.addEventListener('change', listener);
        } else if (media.addListener) {
            media.addListener(listener);
        }

        // Cleanup function to remove the listener when the component unmounts.
        return () => {
             if (media.removeEventListener) {
                media.removeEventListener('change', listener);
            } else if (media.removeListener) {
                media.removeListener(listener);
            }
        };
    }, [matches, query]); // Re-run the effect if the query string changes.

    return matches;
};

export default useMediaQuery;