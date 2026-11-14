# Anatomy viewer attribution

## Viewer code

This viewer is adapted from **Anatolume** (https://github.com/isunky/Anatolume).

MIT License · Copyright (c) 2026 ashemag

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Anatomy data

BodyParts3D, © The Database Center for Life Science, licensed under CC BY 4.0.

- License: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html
- Dataset: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
- License terms: https://creativecommons.org/licenses/by/4.0/
- Source geometry: `isa_BP3D_4.0_obj_99.zip`, BodyParts3D 4.0.
- Publication: Mitsuhashi et al. (2009), BodyParts3D: 3D structure database for anatomical concepts. https://doi.org/10.1093/nar/gkn613

The included male reference model contains 2,234 individual meshes. Upstream
adaptations: axes and units converted from millimeters/Z-up to meters/Y-up,
translated to rest at the stage, simplified using meshoptimizer with a 0.2%
relative error limit per structure, normals quantized to signed 16-bit, packed
into binary chunks, and grouped into display systems with curated colors.
Original source identity is preserved in `atlas.json`.

BodyParts3D represents an adult male reference anatomy based on TARO MRI and
anatomical illustration refinements. It is not a complete model of every
possible human anatomical structure or variation. This interface is
educational and is not a clinical tool.
