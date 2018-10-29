# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2018-10-29
### Changed
- Moved source files to the `src` folder.
- Converted source files to use modules.
- Added UMD variants to the `umd` folder.

## [0.0.9] - 2018-08-05
### Fixed
- Textures are no longer discarded when the material is a MeshBasicMaterial in the web component.

## [0.0.8] - 2018-08-05
### Added
- Support for `wrl` extension

## [0.0.7] - 2018-08-04
### Added
- Contributing.md
- Files field in `package.json`

## [0.0.6] - 2018-07-14
### Changed
- Make the element redraw when textures have loaded

### Fixed
- Fix Phong copy from Lambert so shadows look nice

## [0.0.5] - 2018-06-30
### Changed
- Make the shadows encapsulate the bounding box of the model

### Fixed
- Fix Phong copy from Lambert so shadows look nice

## [0.0.4] - 2018-06-28
### Changed
- Tighten shadows so they are rendered based on the bounds of the model
- Remove Lambert materials so shadows aren't rendered as black

### Fixed
- Update the hemisphere light initial color
- Fix gamma correction on materials not working if a mesh had multiple materials

## [0.0.3] - 2018-06-28
### Changed
- Change the ambient light to a HemisphereLight
- Enable gamma correction on display

### Fixed
- Fix the `display-shadow` not doing anything

## [0.0.2] - 2018-06-22
### Added
- `redraw()` function to the viewer element
- Add `auto-redraw` attribute to the viewer element
