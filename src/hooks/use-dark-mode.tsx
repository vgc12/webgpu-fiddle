import {useEffect, useState} from "react";

export function useDarkMode() {
    const [isDarkMode, setIsDarkMode] = useState(() => {

        return localStorage.getItem('darkMode') !== 'false';
    });
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');

        } else {
            document.documentElement.classList.remove('dark');
        }

        localStorage.setItem('darkMode', isDarkMode.toString());
    }, [isDarkMode]);

    return [isDarkMode, setIsDarkMode];
}