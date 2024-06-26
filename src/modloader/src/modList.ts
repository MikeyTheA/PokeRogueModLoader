import { LoaderData, modsHandler } from "./main";
import { requestInformation } from "./networking";

export const showModList = () => {
  const selectedModId = LoaderData.getData("selectedModId", undefined, false);

  {
    // Left pane, mod selector
    ImGui.BeginGroup();

    ImGui.BeginChild("ModSelectorPane##ModList", new ImGui.Vec2(140, 0), true);
    modsHandler.mods.forEach((mod, modorder) => {
      if (ImGui.Selectable(`${mod.name}##ModIdSelectable${mod.id}`, selectedModId === mod.id)) {
        LoaderData.setData("selectedModId", mod.id, false);
      }
      if (ImGui.IsItemActive() && !ImGui.IsItemHovered()) {
        const n_next = modorder + (ImGui.GetMouseDragDelta(0).y < 0 ? -1 : 1);
        if (n_next >= 0 && n_next < ImGui.ARRAYSIZE(modsHandler.mods)) {
          modsHandler.mods[modorder] = modsHandler.mods[n_next];
          modsHandler.mods[n_next] = mod;
          ImGui.ResetMouseDragDelta();
          modsHandler.save();
        }
      }
    });

    ImGui.EndChild();
    ImGui.EndGroup();
  }

  ImGui.SameLine();

  {
    // Right pane, mod info
    ImGui.BeginGroup();
    ImGui.BeginChild("ModView##ModList", new ImGui.Vec2(0, 0));
    const mod = modsHandler.getMod(selectedModId);
    if (mod !== undefined) {
      ImGui.Text(mod.name);

      ImGui.BeginTabBar("##ModListModOptionsTabBar");

      if (ImGui.BeginTabItem("Details##ModListModOptions")) {
        if (mod.description) {
          ImGui.TextWrapped(`Description: ${mod.description}`);
        }
        ImGui.Text(`Author: ${mod.author}`);
        ImGui.Text(`Version: ${mod.version}`);

        if (mod.github) {
          ImGui.Text("URL: ");
          ImGui.SameLine();
          if (ImGui.SmallButton(mod.id)) {
            window.open(mod.id);
          }

          const fullname = mod.id.replace("https://github.com/", "").split("/");
          const author = fullname[0];
          const name = fullname[1];

          const modData = LoaderData.getData(`modbrowser|moddata${name}${author}`, undefined, false);

          if (modData) {
            ImGui.Text(`Newest version: ${modData.version}`);

            if (modData.version !== mod.version && !LoaderData.getData(`modbrowser|${modData.url}|downloading`, false, false) && ImGui.Button("Update")) {
              LoaderData.setData(`modbrowser|${modData.url}|downloading`, true, false);
              modData.scripts.forEach((script) => {
                requestInformation(script.download_url, `scriptdownloads2|${modData.url}|${script.name}`, false);
              });
            }

            if (LoaderData.getData(`modbrowser|${modData.url}|downloading`, false, false)) {
              const scripts = [];
              modData.scripts.forEach((script) => {
                const name = script.name.slice(0, -3);
                const code = LoaderData.getData(`scriptdownloads2|${modData.url}|${script.name}`, undefined, false);
                if (!code) {
                  ImGui.Text(`Downloading ${name}`);
                  return;
                }
                scripts.push({
                  name: name,
                  code: code,
                });
              });
              if (scripts.length === modData.scripts.length) {
                LoaderData.setData(`modbrowser|${modData.url}|downloading`, false, false);

                mod.description = modData.description || "";
                mod.version = modData.version || "1.0";

                scripts.forEach((script) => {
                  const changescript = mod.scripts.find((scriptcheck) => scriptcheck.name === script.name);
                  if (changescript) {
                    changescript.code = script.code;
                    changescript.reload();
                  } else {
                    mod.addScript(script);
                  }
                });

                mod.scripts.forEach((script) => {
                  if (!scripts.find((scriptcheck) => scriptcheck.name === script.name)) {
                    script.delete();
                  }
                });
                modsHandler.save();
              }
            }
          } else {
            ImGui.Text("Downloading mod information");
            requestInformation(`/mod?name=${name}&author=${author}`, `modbrowser|moddata${name}${author}`, true);
          }

          ImGui.PushStyleColor(ImGui.Col.Button, ImGui.IM_COL32(230, 0, 0, 255));
          ImGui.PushStyleColor(ImGui.Col.ButtonHovered, ImGui.IM_COL32(150, 20, 20, 255));
          if (ImGui.Button("Remove")) {
            mod.delete()
          }
          ImGui.PopStyleColor()
          ImGui.PopStyleColor()

        }
        ImGui.EndTabItem();
      }

      if (ImGui.BeginTabItem("Scripts##ModListModOptions")) {
        ImGui.BeginGroup();

        ImGui.BeginChild("Script list##ModListModOptionsScripts", new ImGui.Vec2(0, 0));
        mod.scripts.forEach((script) => {
          ImGui.Text(`${script.name}`);
          ImGui.SameLine();
          if (ImGui.SmallButton(`Peek##${script.id}`)) {
            LoaderData.setData("selectedModIdShowScript", mod.id);
            LoaderData.setData("selectedScriptIdShowScript", script.id);
            LoaderData.setData("WindowOpenStatescriptpeeker", true);
          }
        });

        ImGui.EndChild();

        ImGui.EndGroup();
        ImGui.EndTabItem();
      }

      if (ImGui.BeginTabItem("Logs##ModListModOptions")) {
        ImGui.BeginGroup();
        ImGui.BeginChild("Mod logs##ModListModOptions", new ImGui.Vec2(0, -ImGui.GetFrameHeightWithSpacing()), true);
        const logs = LoaderData.getData(`LogsForMod${mod.id}`, [], false);
        logs.forEach((log, logindex) => {
          if (log[0] === "log" && typeof log[1] === "object") {
            if (ImGui.TreeNode(`${log[1].constructor.name}##Logs${logindex}`)) {
              treeObject(log[1], logindex);

              if (ImGui.TreeNode(`Prototypes##${log[1].constructor.name}${logindex}`)) {
                let proto = Object.getPrototypeOf(log[1]);
                while (proto) {
                  treeObject(proto, logindex);
                  proto = Object.getPrototypeOf(proto);
                }
                ImGui.TreePop();
              }

              ImGui.TreePop();
            }
          } else {
            if (log[0] === "error") {
              ImGui.PushStyleColor(ImGui.ImGuiCol.Text, ImGui.IM_COL32(255, 150, 150, 255));
            }
            ImGui.Text(String(log[1]));
            if (log[0] === "error") {
              ImGui.PopStyleColor();
            }
          }
        });
        ImGui.EndChild();
        if (ImGui.Button("Clear")) {
          LoaderData.setData(`LogsForMod${mod.id}`, [], false);
        }
        ImGui.EndGroup();
        ImGui.EndTabItem();
      }

      ImGui.EndTabBar();
    }

    ImGui.EndChild();
    ImGui.EndGroup();
  }
};

export const showScript = () => {
  const selectedModId = LoaderData.getData("selectedModIdShowScript", undefined, false);
  const selectedScriptId = LoaderData.getData("selectedScriptIdShowScript", undefined, false);

  if (selectedModId && selectedScriptId) {
    const mod = modsHandler.getMod(selectedModId);
    if (mod) {
      const script = mod.scripts.find((scriptsearch) => scriptsearch.id === selectedScriptId);
      if (script) {
        const formatted = LoaderData.getData(`JSBeautified|${script.id}`, undefined, false) || js_beautify(script.code, { indent_size: 2, space_in_empty_paren: true });
        LoaderData.setData(`JSBeautified|${script.id}`, formatted, false);
        codeHighlighting(script.code, 6, 20);
      }
    }
  }
};

type ColorTuple = [number, number, number, number];

type CodeEditorTheme = {
  [key: string]: ColorTuple;
};

const codeEditorTheme: CodeEditorTheme = {
  plain: [255, 255, 255, 255],
  cdata: [112, 128, 144, 255],
  comment: [112, 128, 144, 255],
  doctype: [112, 128, 144, 255],
  prolog: [112, 128, 144, 255],
  punctuation: [153, 153, 153, 255],
  boolean: [153, 0, 85, 255],
  constant: [153, 0, 85, 255],
  deleted: [153, 0, 85, 255],
  number: [153, 0, 85, 255],
  property: [153, 0, 85, 255],
  symbol: [153, 0, 85, 255],
  tag: [153, 0, 85, 255],
  attr_name: [102, 153, 0, 255],
  builtin: [102, 153, 0, 255],
  char: [102, 153, 0, 255],
  inserted: [102, 153, 0, 255],
  selector: [102, 153, 0, 255],
  string: [154, 110, 58, 255],
  entity: [154, 110, 58, 255],
  operator: [154, 110, 58, 255],
  url: [154, 110, 58, 255],
  atrule: [0, 119, 170, 255],
  attr_value: [0, 119, 170, 255],
  keyword: [0, 119, 170, 255],
  class_name: [221, 74, 104, 255],
  function: [221, 74, 104, 255],
  important: [238, 153, 0, 255],
  regex: [238, 153, 0, 255],
  variable: [238, 153, 0, 255],
};

function codeHighlighting(code: string, x: number, y: number) {
  const highlightedHTML = Prism.highlight(code, Prism.languages.javascript, "javascript");
  const lineHeight = ImGui.GetTextLineHeight();

  highlightedHTML.split("\n").forEach((line, index) => {
    const leadingWhitespace = line.match(/^\s*/)[0];

    let tabCount = 0;
    let spaceCount = 0;
    for (let i = 0; i < leadingWhitespace.length; i++) {
      if (leadingWhitespace[i] === "\t") {
        tabCount++;
      } else if (leadingWhitespace[i] === " ") {
        spaceCount++;
      } else {
        break;
      }
    }
    ImGui.SetCursorPos(new ImGui.Vec2(x + ImGui.CalcTextSize("    ".repeat(tabCount)).x + ImGui.CalcTextSize(" ".repeat(spaceCount)).x, y + index * lineHeight));

    const parser = new DOMParser();
    const doc = parser.parseFromString(line, "text/html");

    let currentX = x;

    doc.body.childNodes.forEach((node) => {
      const text = node.textContent || "";
      const className = (node as any).className;

      let color: [number, number, number, number] = codeEditorTheme["plain"];
      if (className && codeEditorTheme[className.split(" ")[1]]) {
        color = codeEditorTheme[className.split(" ")[1]];
      }

      ImGui.PushStyleColor(ImGui.ImGuiCol.Text, ImGui.IM_COL32(...color));
      ImGui.SetCursorPos(new ImGui.Vec2(currentX + ImGui.CalcTextSize("    ".repeat(tabCount)).x + ImGui.CalcTextSize(" ".repeat(spaceCount)).x, y + index * lineHeight));
      ImGui.Text(text);
      currentX += ImGui.CalcTextSize(text).x;
      ImGui.PopStyleColor();
    });
  });
}

function treeObject(obj: Object, index: number, path = "") {
  for (const key of Object.getOwnPropertyNames(obj)) {
    const value = obj[key];
    const fullPath = path + key;
    if (typeof value === "object" && value !== null) {
      if (ImGui.TreeNode(`${key}##TreeObject${fullPath}${index}`)) {
        treeObject(value, index, fullPath + ".");
        ImGui.TreePop();
      }
    } else {
      ImGui.Text(`${key}: ${value} (${typeof value})`);
    }
  }
}
