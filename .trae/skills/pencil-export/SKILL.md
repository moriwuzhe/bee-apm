---
name: "pencil-export"
description: "Export Pencil .pen design files to PNG/PDF formats. Invoke when user asks to export, save, or download their Pencil design."
---

# Pencil Export Skill

Export Pencil design files to various formats for sharing and presentation.

## How to Export from Pencil

Pencil does not have a built-in export command in the CLI. However, you can export designs through the following methods:

### Method 1: Export via Pencil UI
1. Open the Pencil application
2. Open your design file (`.pen`)
3. Select the frame or page you want to export
4. Go to **File > Export** or use **Ctrl+E** (Windows) / **Cmd+E** (Mac)
5. Choose your desired format (PNG, PDF, SVG)
6. Set the export options (scale, background, etc.)
7. Click Export

### Method 2: Export All Frames as PNG
1. In Pencil, go to **File > Export All Frames**
2. Select destination folder
3. Choose PNG format and scale (recommended: 2x for high quality)
4. Click Export

### Method 3: Export to PDF
1. In Pencil, select the frame or entire page
2. Go to **File > Export as PDF**
3. Choose page size and orientation
4. Export

## Export Settings Recommended

For monitoring dashboards and data visualization designs:
- **Format**: PNG (for web/presentations) or PDF (for documents)
- **Scale**: 2x (for retina/high-DPI displays)
- **Background**: Include background color
- **Selection**: Export entire canvas or specific frames

## File Locations

The BeeAPM design file is located at:
```
pencil/BeeAPM监控平台.pen
```

To find all .pen files in the project:
```
**/*.pen
```