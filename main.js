'use strict';

var obsidian = require('obsidian');

const DEFAULT_SETTINGS = {
    folderDepth: "1",
    tagPrefix: "",
    tagSuffix: ""
};
class FolderTagPlugin extends obsidian.Plugin {
    async onload() {
        await this.loadSettings();
        this.addSettingTab(new FolderTagSettingTab(this.app, this));
        this.registerEvent(this.app.vault.on("create", async (file) => {
            if (file instanceof obsidian.TFile && file.extension === "md") {
                await this.applyFolderTag(file, "create");
            }
        }));
        this.registerEvent(this.app.vault.on("rename", async (file, oldPath) => {
            if (file instanceof obsidian.TFile && file.extension === "md") {
                await this.applyFolderTag(file, "move", oldPath);
            }
        }));
    }
    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }
    async saveSettings() {
        await this.saveData(this.settings);
    }
    getFolderTags(file) {
        return this.getFolderTagsFromPath(file.path);
    }
    getFolderTagsFromPath(path) {
        const normalized = obsidian.normalizePath(path);
        const parts = normalized.split("/").slice(0, -1);
        if (!parts.length)
            return [];
        const { folderDepth, tagPrefix, tagSuffix } = this.settings;
        let tags = [];
        switch (folderDepth) {
            case "1":
                tags.push(tagPrefix + parts[parts.length - 1] + tagSuffix);
                break;
            case "2split":
                if (parts.length >= 2) {
                    tags.push(tagPrefix + parts[parts.length - 1] + tagSuffix);
                    tags.push(tagPrefix + parts[parts.length - 2] + tagSuffix);
                }
                else {
                    tags.push(tagPrefix + parts[parts.length - 1] + tagSuffix);
                }
                break;
            case "2single":
                if (parts.length >= 2) {
                    tags.push(tagPrefix + parts[parts.length - 2] + "/" + parts[parts.length - 1] + tagSuffix);
                }
                else {
                    tags.push(tagPrefix + parts[parts.length - 1] + tagSuffix);
                }
                break;
            case "full":
                tags.push(tagPrefix + parts.join("/") + tagSuffix);
                break;
        }
        return tags;
    }
    // -------------------------
    // Apply folder tags
    // -------------------------
    async applyFolderTag(file, action, oldPath) {
        const folderTags = this.getFolderTags(file);
        if (!folderTags.length)
            return;
        await this.app.fileManager.processFrontMatter(file, yaml => {
            if (!yaml || typeof yaml !== "object")
                return;
            let existingTags = [];
            if ("tags" in yaml) {
                if (Array.isArray(yaml.tags))
                    existingTags.push(...yaml.tags.map((t) => String(t).trim()));
                else if (typeof yaml.tags === "string")
                    existingTags.push(...yaml.tags.split(",").map((t) => t.trim()));
            }
            // Remove old folder tags if moving/rerunning
            if ((action === "move" || action === "rerun") && oldPath) {
                const oldTags = this.getFolderTagsFromPath(oldPath);
                existingTags = existingTags.filter(t => !oldTags.includes(t));
            }
            // Add new folder tags
            folderTags.forEach(t => { if (!existingTags.includes(t))
                existingTags.push(t); });
            yaml.tags = existingTags;
        });
    }
    // -------------------------
    // Remove folder tags
    // -------------------------
    async removeFolderTags(file) {
        const folderTags = this.getFolderTags(file);
        if (!folderTags.length)
            return;
        await this.app.fileManager.processFrontMatter(file, yaml => {
            if (!yaml || typeof yaml !== "object")
                return;
            let existingTags = [];
            if ("tags" in yaml) {
                const val = yaml.tags;
                if (Array.isArray(val))
                    existingTags.push(...val.map(v => String(v).trim()));
                else if (typeof val === "string")
                    existingTags.push(...val.split(",").map(v => v.trim()));
            }
            existingTags = existingTags.filter(t => !folderTags.includes(t));
            if (existingTags.length === 0)
                delete yaml.tags;
            else
                yaml.tags = existingTags;
        });
    }
}
// -------------------------
// Settings Tab
// -------------------------
class FolderTagSettingTab extends obsidian.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }
    display() {
        const { containerEl } = this;
        containerEl.empty();
        new obsidian.Setting(containerEl).setHeading().setName("Folder to tag");
        new obsidian.Setting(containerEl)
            .setName("Folder depth")
            .addDropdown(drop => {
            drop.addOption("1", "Depth 1")
                .addOption("2split", "Depth 2 (separate tags)")
                .addOption("2single", "Depth 2 in one tag")
                .addOption("full", "Full path")
                .setValue(this.plugin.settings.folderDepth)
                .onChange(async (value) => {
                this.plugin.settings.folderDepth = value;
                await this.plugin.saveSettings();
            });
        });
        new obsidian.Setting(containerEl)
            .setName("Tag prefix")
            .addText(txt => txt
            .setValue(this.plugin.settings.tagPrefix)
            .onChange(async (value) => {
            this.plugin.settings.tagPrefix = value;
            await this.plugin.saveSettings();
        }));
        new obsidian.Setting(containerEl)
            .setName("Tag suffix")
            .addText(txt => txt
            .setValue(this.plugin.settings.tagSuffix)
            .onChange(async (value) => {
            this.plugin.settings.tagSuffix = value;
            await this.plugin.saveSettings();
        }));
        new obsidian.Setting(containerEl)
            .setName("Reapply tags to all notes")
            .addButton(btn => btn
            .setButtonText("Reapply to all notes")
            .setCta()
            .onClick(async () => {
            new obsidian.Notice("Updating all notes...");
            const files = this.plugin.app.vault.getMarkdownFiles();
            for (const file of files) {
                try {
                    await this.plugin.applyFolderTag(file, "rerun");
                }
                catch (e) {
                    console.error("Failed for file:", file.path, e);
                    new obsidian.Notice(`Failed to process: ${file.path}`);
                }
            }
            new obsidian.Notice("Folder tags updated for all notes!");
        }));
        new obsidian.Setting(containerEl)
            .setName("Remove all folder tags")
            .addButton(btn => btn
            .setButtonText("Remove folder tags")
            .setCta()
            .onClick(async () => {
            new obsidian.Notice("Removing folder tags from all notes...");
            const files = this.plugin.app.vault.getMarkdownFiles();
            for (const file of files) {
                await this.plugin.removeFolderTags(file);
            }
            new obsidian.Notice("All folder tags removed!");
        }));
    }
}

module.exports = FolderTagPlugin;
//# sourceMappingURL=main.js.map
