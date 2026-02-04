import os
from pathlib import Path

# Configuration
IGNORE_DIRS = {
    'node_modules', '.git', 'dist', 'build', '.firebase', 
    'coverage', '.DS_Store', '__pycache__', '.venv', 'venv'
}
IGNORE_FILES = {
    '.DS_Store', 'package-lock.json', 'yarn.lock', 
    '.gitignore', '.firebaserc', 'CODEBASE.md'
}
KEY_FILES = {
    'schema.ts', 'App.tsx', 'firebase.json', 'firestore.rules',
    'GEMINI.md', 'CODEBASE.md'
}

def get_tree_structure(start_path: Path, prefix: str = ""):
    output = []
    
    # Get all items in directory
    try:
        items = sorted(os.listdir(start_path))
    except PermissionError:
        return []

    # Filter items
    items = [i for i in items if i not in IGNORE_DIRS and i not in IGNORE_FILES]
    
    # Process items
    for index, item in enumerate(items):
        path = start_path / item
        is_last = index == len(items) - 1
        connector = "└── " if is_last else "├── "
        
        # Annotation for key files
        annotation = " 🔑" if item in KEY_FILES else ""
        if path.suffix in ['.ts', '.tsx', '.js', '.jsx', '.py']:
            annotation += f" ({path.suffix})"

        output.append(f"{prefix}{connector}{item}{annotation}")

        if path.is_dir():
            extension = "    " if is_last else "│   "
            output.extend(get_tree_structure(path, prefix + extension))
            
    return output

def generate_map(root_path: str):
    root = Path(root_path)
    
    # Header
    content = [
        "# 🗺️ Project Codebase Map",
        f"> **Last Updated:** {os.popen('date').read().strip()}",
        "> **Auto-Generated:** Do not edit manually. Run `.agent/scripts/update_map.py` to refresh.",
        "",
        "## 🏗️ high-Level Structure",
        "- **`/src`**: Frontend Application (React/Vite)",
        "- **`/functions`**: Backend Logic (Firebase Cloud Functions)",
        "- **`/.agent`**: AI Configuration & Governance",
        "",
        "## 📂 Complete File Tree",
        "```plaintext"
    ]
    
    # Tree Generation
    content.extend(get_tree_structure(root))
    content.append("```")
    
    # Write to file
    output_file = root / "CODEBASE.md"
    with open(output_file, "w") as f:
        f.write("\n".join(content))
    
    print(f"✅ Codebase map updated: {output_file}")

if __name__ == "__main__":
    generate_map(".")
