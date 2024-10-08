import { LoaderData } from './main';
import { windowHandler } from './windows';
import { Window } from './windows';

export const showMainMenu = () => {
	ImGui.Text('Originally made by MikeyTheA');
	ImGui.Text('This is not the official website of');
	ImGui.SameLine();
	if (ImGui.SmallButton('PokeRogue')) {
		open('https://pokerogue.net/');
	}

	ImGui.Text('The project is open source on github');
	if (ImGui.SmallButton('https://github.com/MikeyTheA/PokeRogueModLoader')) {
		open('https://github.com/MikeyTheA/PokeRogueModLoader');
	}
	ImGui.Text('Join our discord: ');
	ImGui.SameLine();
	if (ImGui.SmallButton('https://discord.gg/JCE5fwfsca')) {
		open('https://discord.gg/JCE5fwfsca');
	}

	if (ImGui.CollapsingHeader('Windows')) {
		windowHandler.Windows.forEach((window: Window) => {
			if (window.flags.hidden) {
				return;
			}
			const windowOpen: Function = LoaderData.getAccess(`WindowOpenState${window.identifier}`, window.flags.open, window.flags.persistentOpen);
			ImGui.Checkbox(`${window.name}`, windowOpen as ImGui.ImAccess<boolean>);
		});
	}
};
