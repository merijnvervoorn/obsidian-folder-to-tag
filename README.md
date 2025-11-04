# Folder to Tag Obsidian Plugin

Automatically tags notes in Obsidian based on the folder they are stored in. For if you like to organize your notes by folder but want to use tags for easier searching, linking and graph view.  
Supports both **YAML frontmatter** and **inline tags**, and updates tags when notes are moved or renamed.  

## Features

- Automatically adds a tag that matches the first folder of each note.
- Works for both **YAML frontmatter** (`tags:`) and **inline tags** (`tags::`).
- Updates tags when notes are **moved or renamed**.
- Provides a **settings tab**:
  - Choose default tag style (`YAML` or `Inline`).
  - Override existing tags style if needed.
  - Reapply folder tags to all notes.
  - Remove all folder tags if you want to undo the plugin’s changes.
- Preserves all other frontmatter fields (aliases, dates, custom properties, etc.).
- Compatible with existing notes without folder tags.

## Usage

- When a new note is created, the plugin automatically adds a tag matching its folder.
- If you move or rename a note, the plugin updates the tag to match the new folder.
- Use the settings tab to:
  - Reapply tags to all existing notes.
  - Remove all folder tags from notes if needed.

## Settings

- **Override existing tags style**: Forces all tags to follow your chosen style, even on notes with existing tags.
- **Default tag style**: Choose whether to use YAML frontmatter or inline tags (effective only if override is enabled).
- **Reapply tags to all notes**: Updates all existing notes with the correct folder tag.
- **Remove all folder tags**: Removes any tag that matches the note’s folder name (useful to undo plugin changes).

## License

This plugin is released under the [GNU GPL v3](LICENSE).
