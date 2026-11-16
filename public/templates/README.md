# Astragal dice design templates

Two independent design formats. All artwork is cosmetic: the die shape, mass, numbered faces, and roll physics remain managed by Astragal.

## 1. Surface + logo

- **surface-template.png**: 1024 × 1024 repeating surface tile. Replace the supplied green/gold pattern with your own artwork. PNG, JPEG, or WebP uploads are accepted (5 MB maximum). The same tile repeats on each face; this is not a numbered-face atlas. Keep contrast behind the supplied numerals low. No printed guide lines or numbers belong in this file.
- **logo-template.png**: 1024 × 1024 transparent emblem. Replace the sample mark. Keep the art within the middle 70% and preserve transparent margins. Astragal places it separately from the numbers.
- **logo-template.svg**: editable vector source for that emblem. Edit in Illustrator, Affinity, Inkscape, etc., and export PNG before uploading.
- **layout-guide.png**: visual reference only. Do not upload it as your surface.

## 2. Translucent surface + internal 3D model

- **translucent-surface-template.png**: 1024 × 1024 RGBA artwork for the shell. Transparent regions let the selected tint and internal object show. Keep most of the image transparent; opaque photography will hide the model. The shell-opacity control is independent of image alpha.
- **interior-template.glb**: a real static 3D crystal and orbital rings with embedded geometry and materials. Open it in Blender or another glTF-capable editor, replace the example with your design, and export binary glTF 2.0 (.glb).
- Keep the model static, under 50,000 triangles and 5 MB; at most 64 objects. Apply transforms before export and embed all textures. Export meshes, no cameras/lights/armatures/animation, and disable Draco/Meshopt/KTX compression. Do not include the die shell or numbers in the interior file.
- Astragal automatically centers and fits the design inside the selected die. The model is attached rigidly to the die, not simulated as a loose object. A d4 has less internal volume than a d20.
- **layout-guide.png**: shell design reference only.

## Try them

Open the local workshop, choose **Admin view**, then select a design format. Download the appropriate template pack, upload its matching assets, choose **Preview in tray**, and cast. Publish the finish locally to make it selectable in Player view. This workshop simulates roles; production publishing will use Syntarion's verified admin role and backend storage.

The PNG templates contain example artwork you can upload immediately. The guide images are separate and should not be uploaded.
