import { App, Plugin, TFile, Notice, PluginSettingTab, Setting } from "obsidian";
import jsyaml from 'js-yaml';

interface FolderTagPluginSettings {
    defaultTagStyle: "yaml" | "inline";
    overrideExisting: boolean;
    folderDepth: "1" | "2split" | "2single" | "full";
    tagPrefix: string;
    tagSuffix: string;
}

const DEFAULT_SETTINGS: FolderTagPluginSettings = {
    defaultTagStyle: "yaml",
    overrideExisting: false,
    folderDepth: "1",
    tagPrefix: "",
    tagSuffix: ""
};

export default class FolderTagPlugin extends Plugin {
    settings!: FolderTagPluginSettings;

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new FolderTagSettingTab(this.app, this));

        // Note creation
        this.registerEvent(
            this.app.vault.on("create", async (file) => {
                if (file instanceof TFile && file.extension === "md") {
                    await this.applyFolderTag(file, "create");
                }
            })
        );

        // Note rename/move
        this.registerEvent(
            this.app.vault.on("rename", async (file, oldPath) => {
                if (file instanceof TFile && file.extension === "md") {
                    await this.applyFolderTag(file, "move", oldPath);
                }
            })
        );
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    // -------------------------
    // Get folder tags based on depth and prefix/suffix
    // -------------------------
    private getFolderTags(file: TFile): string[] {
        const pathParts = file.path.split("/").slice(0, -1); // all folders leading to the file
        if (pathParts.length === 0) return [];

        const { folderDepth, tagPrefix, tagSuffix } = this.settings;
        let tags: string[] = [];

        switch (folderDepth) {
            case "1":
                tags.push(tagPrefix + pathParts[pathParts.length - 1] + tagSuffix);
                break;
            case "2split":
                if (pathParts.length >= 2) {
                    tags.push(tagPrefix + pathParts[pathParts.length - 1] + tagSuffix);
                    tags.push(tagPrefix + pathParts[pathParts.length - 2] + tagSuffix);
                } else {
                    tags.push(tagPrefix + pathParts[pathParts.length - 1] + tagSuffix);
                }
                break;
            case "2single":
                if (pathParts.length >= 2) {
                    tags.push(tagPrefix + pathParts[pathParts.length - 2] + "/" + pathParts[pathParts.length - 1] + tagSuffix);
                } else {
                    tags.push(tagPrefix + pathParts[pathParts.length - 1] + tagSuffix);
                }
                break;
            case "full":
                tags.push(tagPrefix + pathParts.join("/") + tagSuffix);
                break;
        }

        return tags;
    }

    // -------------------------
    // Apply folder tags
    // -------------------------
    async applyFolderTag(file: TFile, action: "create" | "move" | "rerun", oldPath?: string) {
        const folderTags = this.getFolderTags(file);
        if (!folderTags.length) return;

        let content = await this.app.vault.read(file);

        // --- YAML frontmatter ---
        const yamlRegex = /^---\n([\s\S]*?)\n---/;
        const hasYAML = yamlRegex.test(content);

        if (hasYAML && (action !== "create" || this.settings.overrideExisting)) {
            const match = content.match(yamlRegex)!;
            let yamlStr = match[1];
            let body = content.replace(yamlRegex, "").trimStart();

            let yamlObj: Record<string, any> = {};
            try {
                yamlObj = jsyaml.load(yamlStr) as Record<string, any> || {};
            } catch (e) {
                console.error("Failed to parse YAML", e);
            }

            let tags: string[] = Array.isArray(yamlObj.tags) ? yamlObj.tags : [];

            // Remove old folder tag if moving
            if ((action === "move" || action === "rerun") && oldPath) {
                const oldFolder = oldPath.split("/").slice(-2, -1)[0];
                tags = tags.filter(t => t !== oldFolder);
            }

            // Add new folder tags
            for (const t of folderTags) {
                if (!tags.includes(t)) tags.push(t);
            }

            yamlObj.tags = tags;

            const newYaml = jsyaml.dump(yamlObj, { lineWidth: -1 }).trim();
            const newContent = `---\n${newYaml}\n---\n${body}`;
            await this.app.vault.modify(file, newContent);
            return;
        }

        // --- Inline tags ---
        const inlineTagRegex = /^tags\s*::?\s*(.+)$/m;
        const inlineMatch = content.match(inlineTagRegex);

        if (inlineMatch && (action !== "create" || this.settings.overrideExisting)) {
            let tags = inlineMatch[1].split(",").map(t => t.trim());
            if ((action === "move" || action === "rerun") && oldPath) {
                const oldFolder = oldPath.split("/").slice(-2, -1)[0];
                tags = tags.filter(t => t !== oldFolder);
            }

            for (const t of folderTags) {
                if (!tags.includes(t)) tags.push(t);
            }

            const newLine = `tags:: ${tags.join(", ")}`;
            const newContent = content.replace(inlineTagRegex, newLine);
            await this.app.vault.modify(file, newContent);
            return;
        }

        // --- No tags found → insert YAML frontmatter ---
        const newContent = `---\ntags:\n${folderTags.map(t => `  - ${t}`).join("\n")}\n---\n${content.trimStart()}`;
        await this.app.vault.modify(file, newContent);
    }

    // -------------------------
    // Remove folder tags
    // -------------------------
    async removeFolderTags(file: TFile) {
        const folderTags = this.getFolderTags(file);
        if (!folderTags.length) return;

        let content = await this.app.vault.read(file);

        const yamlRegex = /^---\n([\s\S]*?)\n---/;
        const hasYAML = yamlRegex.test(content);

        if (hasYAML) {
            const match = content.match(yamlRegex)!;
            let yamlStr = match[1];
            let body = content.replace(yamlRegex, "").trimStart();

            let yamlObj: Record<string, any> = {};
            try {
                yamlObj = jsyaml.load(yamlStr) as Record<string, any> || {};
            } catch (e) {
                console.error("Failed to parse YAML", e);
            }

            if (Array.isArray(yamlObj.tags)) {
                yamlObj.tags = yamlObj.tags.filter(t => !folderTags.includes(t));
            }

            const newYaml = jsyaml.dump(yamlObj, { lineWidth: -1 }).trim();
            const newContent = `---\n${newYaml}\n---\n${body}`;
            await this.app.vault.modify(file, newContent);
            return;
        }

        const inlineTagRegex = /^tags\s*::?\s*(.+)$/m;
        const inlineMatch = content.match(inlineTagRegex);

        if (inlineMatch) {
            const tags = inlineMatch[1]
                .split(",")
                .map(t => t.trim())
                .filter(t => !folderTags.includes(t));

            const newLine = `tags:: ${tags.join(", ")}`;
            const newContent = content.replace(inlineTagRegex, newLine);
            await this.app.vault.modify(file, newContent);
            return;
        }
    }
}

// -------------------------
// Settings Tab
// -------------------------
class FolderTagSettingTab extends PluginSettingTab {
    plugin: FolderTagPlugin;

    constructor(app: App, plugin: FolderTagPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl("h2", { text: "Folder to Tag Settings" });

        // Override existing style
        new Setting(containerEl)
            .setName("Override existing tags style")
            .setDesc("If enabled, the plugin will always apply your chosen tag style (YAML or inline) even to notes that already have tags.")
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.overrideExisting)
                .onChange(async (value) => {
                    this.plugin.settings.overrideExisting = value;
                    await this.plugin.saveSettings();
                    this.display();
                })
            );

        // Default tag style
        new Setting(containerEl)
            .setName("Default tag style")
            .setDesc("Choose the tag style used when forcing tags to your preferred format. This setting only applies when 'Override existing tags style' is enabled.")
            .addDropdown(drop => {
                drop
                    .addOption("yaml", "YAML frontmatter")
                    .addOption("inline", "Inline tag")
                    .setValue(this.plugin.settings.defaultTagStyle)
                    .onChange(async (value) => {
                        this.plugin.settings.defaultTagStyle = value as "yaml" | "inline";
                        await this.plugin.saveSettings();
                    });
            });

        // Folder depth
        new Setting(containerEl)
            .setName("Folder Depth")
            .setDesc("Choose how many folder levels to use for tagging.")
            .addDropdown(drop => {
                drop
                    .addOption("1", "Default (Depth 1)")
                    .addOption("2split", "Depth 2 (Separate tags, e.g., #sub + #main)")
                    .addOption("2single", "Depth 2 in one tag, e.g., #main/sub")
                    .addOption("full", "Full path, e.g., #main/sub/subsub")
                    .setValue(this.plugin.settings.folderDepth)
                    .onChange(async (value) => {
                        this.plugin.settings.folderDepth = value as FolderTagPluginSettings["folderDepth"];
                        await this.plugin.saveSettings();
                    });
            });

        // Prefix
        new Setting(containerEl)
            .setName("Tag Prefix")
            .setDesc("Optional prefix to add to all folder tags, e.g., 'folder-' -> #folder-name")
            .addText(txt => txt
                .setPlaceholder("")
                .setValue(this.plugin.settings.tagPrefix)
                .onChange(async (value) => {
                    this.plugin.settings.tagPrefix = value;
                    await this.plugin.saveSettings();
                })
            );

        // Suffix
        new Setting(containerEl)
            .setName("Tag Suffix")
            .setDesc("Optional suffix to add to all folder tags, e.g., '-tag' -> #name-tag")
            .addText(txt => txt
                .setPlaceholder("")
                .setValue(this.plugin.settings.tagSuffix)
                .onChange(async (value) => {
                    this.plugin.settings.tagSuffix = value;
                    await this.plugin.saveSettings();
                })
            );

        // Reapply tags
        new Setting(containerEl)
            .setName("Reapply tags to all notes")
            .setDesc("Adds folder tags to all existing notes in your vault.")
            .addButton(btn => btn
                .setButtonText("Reapply to all notes")
                .setCta()
                .onClick(async () => {
                    new Notice("Updating all notes...");
                    const files = this.plugin.app.vault.getMarkdownFiles();
                    for (const file of files) {
                        await this.plugin.applyFolderTag(file, "rerun");
                    }
                    new Notice("Folder tags updated for all notes!");
                })
            );

        // Remove folder tags button
        new Setting(containerEl)
            .setName("Remove all folder tags")
            .setDesc("Removes all tags from notes that match folder tags (prefix, suffix, and depth-aware).")
            .addButton(btn => {
                btn.setButtonText("Remove folder tags")
                    .setCta();
                btn.buttonEl.addClass("mod-warning"); // red button
                btn.onClick(async () => {
                    new Notice("Removing folder tags...");
                    const files = this.plugin.app.vault.getMarkdownFiles();
                    for (const file of files) {
                        await this.plugin.removeFolderTags(file);
                    }
                    new Notice("All folder tags removed!");
                });
            });
    }
}
