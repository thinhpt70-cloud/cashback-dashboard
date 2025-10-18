import { useState, useEffect } from 'react';

/**
 * A custom React hook that tracks the state of a CSS media query.
 * @param {string} query - The media query string to watch (e.g., "(min-width: 768px)").
 * @returns {boolean} - Returns true if the media query matches, otherwise false.
 */
const useMediaQuery = (query) => {
    // State to store whether the media query matches or not.
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        // Create a MediaQueryList object.
        const media = window.matchMedia(query);

        // Update the state with the initial value on mount.
        if (media.matches !== matches) {
            setMatches(media.matches);
        }

        // Create a listener function to update the state on change.
        const listener = () => {
            setMatches(media.matches);
        };

        // Add the listener for changes to the media query state.
        media.addEventListener('change', listener);

        // Cleanup function to remove the listener when the component unmounts.
        return () => {
            media.removeEventListener('change', listener);
        };
    }, [matches, query]); // Re-run the effect if the query string changes.

    return matches;
};

export default useMediaQuery;