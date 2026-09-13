# Human brain display geometry

Source: **Brain for Blender**, Anderson Winkler, [Brainder](https://brainder.org/research/brain-for-blender/).
Original MRI-derived surfaces reconstructed with FreeSurfer 5.2.
Original and derived geometry: [Creative Commons Attribution–ShareAlike 3.0 Unported](https://creativecommons.org/licenses/by-sa/3.0/).

`human-brain.json` and its `surface.svg` projection are modified, voxel-clustered and rounded derivatives of the original pial and subcortical MZ3 surfaces. Normals and edge indices were recalculated for web display. These derivative geometry assets are distributed under the same CC BY-SA 3.0 license. This attribution does not imply endorsement by the source author. Website code and the decorative activity animation are separate from the source geometry.

Downloads:
- https://s3.us-east-2.amazonaws.com/brainder/software/brain4blender/smallfiles/pial_Full_mz3.tar.bz2
- https://s3.us-east-2.amazonaws.com/brainder/software/brain4blender/smallfiles/subcortical_mz3.tar.bz2

Rebuild: save these as `pial.tar.bz2` and `deep.tar.bz2`, then run `python3 scripts/build-brain-mesh.py /path/to/archives`.

Coordinates retain RAS orientation in millimeters. Meshes include both cortical hemispheres, both cerebellar cortices, brainstem, hippocampi and amygdalae. Region leader lines identify approximate anatomical landmarks; they are not quantitative parcellations. The activity animation is procedural, not recorded experimental activity. Mesh edges describe surface topology, not measured neuronal connections.

Generate the static fallback with `python3 scripts/build-brain-fallback.py`. The hypothalamus is marked only as an approximate region, not a segmented mesh.
