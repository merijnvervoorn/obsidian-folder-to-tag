# Contributing to Folder to Tag

First off, thank you for considering contributing to the **Folder to Tag** Obsidian plugin! It's people like you that make the open-source community such a great place. 

This document provides guidelines and instructions for contributing to this project.

## How Can I Contribute?

### 1. Reporting Bugs
If you find a bug, please check the [Issues](../../issues) tab to see if it has already been reported. If not, please open a new issue and include:
* A clear and descriptive title.
* Steps to reproduce the bug.
* Your current Obsidian version and "Folder to Tag" plugin version.
* Expected behavior vs. actual behavior.
* (Optional but helpful) Screenshots or screen recordings.

### 2. Suggesting Enhancements
Feature requests are always welcome! When opening a feature request issue, please provide:
* A clear description of the proposed feature.
* The use case or problem it solves for you.
* Any potential alternatives or workarounds you've considered.

### 3. Submitting Pull Requests
We welcome code contributions! If you want to fix a bug or add a feature, please follow these steps:

1. **Fork the repository** and create your branch from `main`.
2. **Discuss major changes** in an issue first before spending a lot of time writing code.
3. **Ensure your code works** with the latest Obsidian API and doesn't break existing functionality.
4. **Submit a Pull Request** with a detailed description of what you changed and why.

---

## Local Development Setup

If you want to work on the code locally, follow these steps to set up your development environment.

### Prerequisites
* [Node.js](https://nodejs.org/) installed on your machine.
* A local Obsidian test vault (recommended to not use your primary personal vault for testing new code).

### Installation & Build

1. **Clone your fork** of the repository:
   ```bash
   git clone [https://github.com/YOUR_USERNAME/obsidian-folder-to-tag.git](https://github.com/YOUR_USERNAME/obsidian-folder-to-tag.git)
   cd obsidian-folder-to-tag
    ```
Place it in your Obsidian plugins folder, which is typically located at:
```
obsidian/.obsidian/plugins/folder-to-tag
```