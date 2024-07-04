import { LoaderData } from './main';

export type Window = {
	identifier: string;
	name: string;
	show: Function;
	flags: WindowFlags;
	errorFunc: (message: string) => void;
};

export type WindowFlags = {
	open?: boolean;
	persistentOpen?: boolean;
	hidden?: boolean;
	noClose?: boolean;
	initialWidth?: number;
	initialHeight?: number;
	scriptId?: number;
};

export class WindowHandler {
	public Windows: Array<Window>;

	constructor() {
		this.Windows = [];
	}

	addWindow(name: string, show: Function, flags: WindowFlags, identifier: string = crypto.randomUUID(), errorFunc = (message: string) => {}) {
		const window: Window = {
			identifier: identifier || crypto.randomUUID(),
			name: name,
			show: show,
			errorFunc: errorFunc,
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
			const windowOpen: (value?: boolean) => boolean = LoaderData.getAccess(`WindowOpenState${window.identifier}`, window.flags.open, window.flags.persistentOpen);
			if ((windowOpen() as boolean) && ImGui.Begin(window.name, (!window.flags.noClose && windowOpen) || undefined)) {
				try {
					window.show();
				} catch (e) {
					ImGui.TextColored(new ImGui.ImVec4(1.0, 0.0, 0.0, 1.0), 'error: ');
					ImGui.SameLine();
					ImGui.Text(e.message);
					window.errorFunc(e.message);
				}
				ImGui.End();
			}
		});
	}
}

export const windowHandler = new WindowHandler();
