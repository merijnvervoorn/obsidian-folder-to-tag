# Folder to Tag Obsidian Plugin

Automatically tags notes in Obsidian based on the folder they are stored in.
Ideal for users who organize notes by folder but want to leverage tags for easier searching, linking, and graph view.

---

## Features

* Automatically adds a tag that matches the folder(s) of each note in frontmatter.
* Updates tags when notes are **moved or renamed**.
* Preserves all other frontmatter fields (aliases, dates, custom properties, etc.).
* Compatible with existing frontmatter that do or do not have `tags:`.
* Configurable **folder depth** and **tag formatting**.
* Optional **prefix** and **suffix** for tags.

---

## Folder Depth Options

Choose how many folder levels to include in tags:

| Option           | Example (note path: `main-folder/sub-folder/last-folder/note.md`) |
| ---------------- | ----------------------------------------------------------------- |
| Default (1)      | `#last-folder`                                                    |
| Depth 2 (split)  | `#last-folder + #sub-folder`                                      |
| Depth 2 (single) | `#sub-folder/last-folder`                                         |
| Full path        | `#main-folder/sub-folder/last-folder`                             |

You can also optionally add a **prefix** or **suffix** to all folder tags, e.g., `prefix-` → `#prefix-folder`.

---

## Usage

* When a new note is created, the plugin automatically adds folder tag(s) to the `tags:` property.
* If a note is moved or renamed, the plugin updates its tag(s) to match the new folder path.
* Use the settings tab to:

  * **Reapply tags to all notes**: Updates all notes with the correct folder tags in frontmatter.
  * **Remove all folder tags**: Removes any tag matching the note’s folder from the frontmatter `tags:` property. Preserving any other frontmatter (including other tags).

---

## License

This plugin is released under the [GNU GPL v3](LICENSE).