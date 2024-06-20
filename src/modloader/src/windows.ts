import { LoaderData } from './main';

export type Window = {
    identifier: String;
    name: String;
    show: Function;
    flags: WindowFlags;
};

export type WindowFlags = {
    open?: Boolean;
    persistentOpen?: Boolean;
    hidden?: Boolean;
    noClose?: Boolean;
    initialWidth?: Number;
    initialHeight?: Number;
    scriptId?: Number;
};

export class WindowHandler {
    public Windows: Object[];

    constructor() {
        this.Windows = [];
    }

    addWindow(name: String, show: Function, flags: WindowFlags, identifier: String = crypto.randomUUID()) {
        const window: Window = {
            identifier: identifier || crypto.randomUUID(),
            name: name,
            show: show,
            flags: {
                open: flags.open ?? false,
                persistentOpen: flags.persistentOpen ?? true,
                hidden: flags.hidden ?? false,
                noClose: flags.noClose ?? false,
                initialWidth: flags.initialWidth ?? 500,
                initialHeight: flags.initialHeight ?? 440,
            },
        };
        this.Windows.push(window);
    }

    renderWindows() {
        this.Windows.forEach((window: Window) => {
            ImGui.SetNextWindowSize(new ImGui.Vec2(window.flags.initialWidth, window.flags.initialHeight), ImGui.Cond.FirstUseEver);
            const windowOpen: Function = LoaderData.getAccess(`WindowOpenState${window.identifier}`, window.flags.open, window.flags.persistentOpen);
            if ((windowOpen() as Boolean) && ImGui.Begin(window.name, (!window.flags.noClose && windowOpen) || undefined)) {
                try {
                    window.show();
                } catch (e) {
                    ImGui.TextColored(new ImGui.ImVec4(1.0, 0.0, 0.0, 1.0), 'error: ');
                    ImGui.SameLine();
                    ImGui.Text(e.message);
                }
                ImGui.End();
            }
        });
    }
}

export const windowHandler = new WindowHandler();
