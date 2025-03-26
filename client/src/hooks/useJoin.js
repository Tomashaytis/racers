import { useState } from 'react';

export const useJoin = (isJoin, playerName) => {
    const [value, setValue] = useState(isJoin);
    const join = () => setValue(!value);
    return [value, join];
};