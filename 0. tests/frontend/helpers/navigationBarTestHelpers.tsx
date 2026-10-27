import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import NavigationBar from "../../../3. frontend/src/components/NavigationBar";


export function renderNavigationBar({
    darkMode = false,
    onToggleDarkMode = () => {},
}: {
    darkMode?: boolean;
    onToggleDarkMode?: () => void;
} = {}) {
    return render(
        <MemoryRouter>
            <NavigationBar
                darkMode={darkMode}
                onToggleDarkMode={onToggleDarkMode}
            />
        </MemoryRouter>,
    );
}
