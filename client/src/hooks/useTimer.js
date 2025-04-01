import { useEffect, useRef } from "react";

/**
 * Starts timer with some time interval and acion
 * @param {number} interval - time interval for timer
 * @param {Function} callback - timer action
 * @param {boolean} isActive - is timer active now
 */
export const useTimer = (interval, callback, isActive) => {
    const timerId = useRef(null);
    const keyState = useRef({
        w: false,
        a: false,
        s: false,
        d: false,
    })

    useEffect(() => {
        if (!(isActive)) {
            if (timerId.current) {
                clearInterval(timerId.current);
                timerId.current = null;
            }
            return;
        }

        const onKeyDown = (e) => {
            const key = e.key.toLowerCase();
            if (keyState.current.hasOwnProperty(key)) {
                keyState.current[key] = true;
            }
        };

        const onKeyUp = (e) => {
            const key = e.key.toLowerCase();
            if (keyState.current.hasOwnProperty(key)) {
                keyState.current[key] = false;
            }
        };

        timerId.current = setInterval(() => {
            const pressedKeys = Object.entries(keyState.current).filter(([_, pressed]) => pressed).map(([key]) => key);
            callback(pressedKeys);
        }, interval);

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
            if (timerId.current) {
                clearInterval(timerId.current);
            }
        };
    }, [interval, callback, isActive]);
};