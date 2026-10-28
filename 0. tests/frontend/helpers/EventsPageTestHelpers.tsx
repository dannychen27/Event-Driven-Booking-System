import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { getEvents } from "../../../3. frontend/src/api/events";
import EventsPage from "../../../3. frontend/src/pages/EventsPage";

export async function renderEventsPageWithNoInitialEvents() {
    vi.mocked(getEvents).mockResolvedValue([]);

    render(<EventsPage />);

    await screen.findByText("No available events right now.");
}
