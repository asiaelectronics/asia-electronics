# Asia Electronics documentation

This documentation describes the current codebase for the Asia Electronics & Cellular storefront and administration platform.

Start with the [project README](https://github.com/asiaelectronics/asia-electronics/blob/main/README.md) for local setup. Use the [architecture guide](architecture.md) to understand data, sessions, files, and notifications. The [API reference](api.md) lists canonical `/api` endpoints and access requirements.

## Documentation site commands

The documentation dependencies are pinned in `requirements-docs.txt`. From a fresh Windows PowerShell clone, run the following from the repository root:

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements-docs.txt
.\.venv\Scripts\python.exe -m mkdocs serve
```

This uses the virtual environment directly, so it works even when PowerShell blocks `Activate.ps1` or `mkdocs.exe` is not on `PATH`.

Open the reported local URL, normally `http://127.0.0.1:8000`.

To publish after reviewing the generated site:

```powershell
.\.venv\Scripts\python.exe -m mkdocs gh-deploy
```

Configure GitHub Pages to serve from the `gh-pages` branch. This command commits and pushes generated output, so it requires GitHub write access.
