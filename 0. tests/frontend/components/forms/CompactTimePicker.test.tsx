import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CompactTimePicker from "../../../../3. frontend/src/components/forms/CompactTimePicker";

describe("CompactTimePicker", () => {
    type PickerOptions = {
        value?: string;
        format?: "12h" | "24h";
        disabled?: boolean;
        onChange?: (value: string | undefined) => void;
    };

    const renderPicker = (options: PickerOptions = {}) => {
        const format = options.format ?? "12h";
        const disabled = options.disabled ?? false;
        const onChange = options.onChange ?? vi.fn();
        const value = Object.prototype.hasOwnProperty.call(options, "value")
            ? options.value
            : "06:30";

        const result = render(
            <CompactTimePicker
                label="After"
                value={value}
                format={format}
                disabled={disabled}
                onChange={onChange}
            />,
        );

        return { ...result, onChange };
    };

    describe("rendering", () => {
        it("renders hour, minute, and AM/PM controls in 12-hour mode", () => {
            renderPicker({ value: "18:30" });

            expect(screen.getByLabelText("After hour")).toHaveValue("06");
            expect(screen.getByLabelText("After minute")).toHaveValue("30");
            expect(screen.getByRole("button", { name: "AM" })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: "PM" })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: "PM" })).toHaveAttribute(
                "aria-pressed",
                "true",
            );
        });

        it("renders only hour and minute inputs in 24-hour mode", () => {
            renderPicker({ value: "18:30", format: "24h" });

            expect(screen.getByLabelText("After hour")).toHaveValue("18");
            expect(screen.getByLabelText("After minute")).toHaveValue("30");
            expect(screen.queryByRole("button", { name: "AM" })).not.toBeInTheDocument();
            expect(screen.queryByRole("button", { name: "PM" })).not.toBeInTheDocument();
        });

        it("does not render increment or decrement controls", () => {
            renderPicker();

            expect(
                screen.queryByRole("button", { name: /increase|decrease/i }),
            ).not.toBeInTheDocument();
        });
    });

    describe("12-hour boundaries", () => {
        it("clamps an entered hour above 12 to 12", () => {
            const { onChange } = renderPicker({ value: "18:00" });
            const hour = screen.getByLabelText("After hour");

            fireEvent.change(hour, { target: { value: "13" } });
            fireEvent.blur(hour);

            expect(hour).toHaveValue("12");
            expect(onChange).toHaveBeenLastCalledWith("12:00");
        });

        it("clamps an entered hour below 1 to 1", () => {
            const { onChange } = renderPicker({ value: "06:00" });
            const hour = screen.getByLabelText("After hour");

            fireEvent.change(hour, { target: { value: "0" } });
            fireEvent.blur(hour);

            expect(hour).toHaveValue("01");
            expect(onChange).toHaveBeenLastCalledWith("01:00");
        });

        it("clamps minutes above 59 to 59", () => {
            const { onChange } = renderPicker({ value: "06:00" });
            const minute = screen.getByLabelText("After minute");

            fireEvent.change(minute, { target: { value: "99" } });
            fireEvent.blur(minute);

            expect(minute).toHaveValue("59");
            expect(onChange).toHaveBeenLastCalledWith("06:59");
        });

        it("clamps an empty minute input to 00", () => {
            const { onChange } = renderPicker({ value: "06:00" });
            const minute = screen.getByLabelText("After minute");

            fireEvent.change(minute, { target: { value: "" } });
            fireEvent.blur(minute);

            expect(minute).toHaveValue("00");
            expect(onChange).toHaveBeenLastCalledWith("06:00");
        });
    });

    describe("24-hour boundaries", () => {
        it("clamps an entered hour above 23 to 23", () => {
            const { onChange } = renderPicker({
                value: "20:00",
                format: "24h",
            });
            const hour = screen.getByLabelText("After hour");

            fireEvent.change(hour, { target: { value: "24" } });
            fireEvent.blur(hour);

            expect(hour).toHaveValue("23");
            expect(onChange).toHaveBeenLastCalledWith("23:00");
        });

        it("supports midnight as 00:00", () => {
            const { onChange } = renderPicker({
                value: "00:00",
                format: "24h",
            });

            expect(screen.getByLabelText("After hour")).toHaveValue("00");
            expect(screen.getByLabelText("After minute")).toHaveValue("00");

            fireEvent.blur(screen.getByLabelText("After hour"));

            expect(onChange).toHaveBeenLastCalledWith("00:00");
        });
    });

    describe("AM/PM conversion", () => {
        it("converts an AM time to PM when PM is selected", () => {
            const { onChange } = renderPicker({ value: "06:30" });

            fireEvent.click(screen.getByRole("button", { name: "PM" }));

            expect(onChange).toHaveBeenLastCalledWith("18:30");
            expect(screen.getByRole("button", { name: "PM" })).toHaveAttribute(
                "aria-pressed",
                "true",
            );
        });

        it("converts midnight to noon when PM is selected", () => {
            const { onChange } = renderPicker({ value: "00:00" });

            fireEvent.click(screen.getByRole("button", { name: "PM" }));

            expect(onChange).toHaveBeenLastCalledWith("12:00");
        });

        it("converts noon to midnight when AM is selected", () => {
            const { onChange } = renderPicker({ value: "12:00" });

            fireEvent.click(screen.getByRole("button", { name: "AM" }));

            expect(onChange).toHaveBeenLastCalledWith("00:00");
        });
    });

    describe("disabled and clear behavior", () => {
        it("disables the inputs, period buttons, and clear button", () => {
            renderPicker({ value: "06:30", disabled: true });

            expect(screen.getByLabelText("After hour")).toBeDisabled();
            expect(screen.getByLabelText("After minute")).toBeDisabled();
            expect(screen.getByRole("button", { name: "AM" })).toBeDisabled();
            expect(screen.getByRole("button", { name: "PM" })).toBeDisabled();
            expect(
                screen.getByRole("button", { name: "Clear After time" }),
            ).toBeDisabled();
        });

        it("clears a selected time by reporting undefined", () => {
            const { onChange } = renderPicker({ value: "06:30" });

            fireEvent.click(
                screen.getByRole("button", { name: "Clear After time" }),
            );

            expect(onChange).toHaveBeenCalledWith(undefined);
        });

        it("disables the clear button when no time is selected", () => {
            renderPicker({ value: undefined });

            expect(
                screen.getByRole("button", { name: "Clear After time" }),
            ).toBeDisabled();
        });
    });

    describe("prop updates", () => {
        it("updates displayed values when the time and format props change", () => {
            const onChange = vi.fn();

            const { rerender } = render(
                <CompactTimePicker
                    label="After"
                    value="18:30"
                    format="12h"
                    disabled={false}
                    onChange={onChange}
                />,
            );

            expect(screen.getByLabelText("After hour")).toHaveValue("06");
            expect(screen.getByRole("button", { name: "PM" })).toHaveAttribute(
                "aria-pressed",
                "true",
            );

            rerender(
                <CompactTimePicker
                    label="After"
                    value="09:15"
                    format="24h"
                    disabled={false}
                    onChange={onChange}
                />,
            );

            expect(screen.getByLabelText("After hour")).toHaveValue("09");
            expect(screen.getByLabelText("After minute")).toHaveValue("15");
            expect(screen.queryByRole("button", { name: "AM" })).not.toBeInTheDocument();

            rerender(
                <CompactTimePicker
                    label="After"
                    value="12:00"
                    format="12h"
                    disabled={false}
                    onChange={onChange}
                />,
            );

            expect(screen.getByLabelText("After hour")).toHaveValue("12");
            expect(screen.getByRole("button", { name: "PM" })).toHaveAttribute(
                "aria-pressed",
                "true",
            );
        });
    });
});
