function showMainMenu(env){
    const {Windows} = env

    if (ImGui.CollapsingHeader('Settings')) {

    }

    if (ImGui.CollapsingHeader('Windows')) {
        for (const [name, window] of Object.entries(Windows)) {
            if(window.flags.hidden) continue
            ImGui.Checkbox(`${name}`, window.open)
        }
    }
}