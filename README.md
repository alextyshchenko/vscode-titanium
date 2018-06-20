# Endless Aisle Package README

## Features

### Available commands

* `EA: Init workspace for Endless Aisle` - Activate extensions and create needed files
* `EA: Build Titanium application` - Build application with params from extension settings
* `EA: Build Titanium application with params` - Build application with promts
* `EA: Clean Titanium data` - Clean project data
* `EA: Connect to logger` - Connect to logger if simulator started

### Available key bindings

* `cmd+shift+i` - Init workspace for Endless Aisle
* `cmd+shift+a` - Build application with params from extension settings
* `cmd+shift+l` - Connect to logger
* `cmd+shift+c` - Clean Titanium data


> Tip: For some commands was added key bindings

##### Extension for Titanium, Alloy and JAST

* `cmd+l` - Alloy: Open Relative Files
* `cmd+shift+c` - Alloy: Open Relative Controller
* `cmd+shift+v` - Alloy: Open Relative View
* `cmd+shift+s` - Alloy: Open Relative Style

##### ESLint
* `ctrl+cmd+f` - Fix all auto-fixable Problems

##### Beautify
* `ctrl+cmd+b` - Beautify file
* `ctrl+cmd+s` - Beautify selection

## Requirements

Extension will be activated if project root folder has `tiapp.xml`

## Extension Settings

Extension adds VS Code settings block `Endless Aisle Package`.


This extension contributes the following settings:

* `eapackage.buildTarget`: Build target (iphone, ipod)
* `eapackage.buildPlatform`: Build Platform (simulator, device, dist-adhoc, dist-appstore)
* `eapackage.buildDevice`: Build device version (iPhone 5s, iPhone SE, etc)
* `eapackage.iosVersion`: iOS Version (11.2, 11.3, 11.4, etc)


## Release Notes


### 1.0.0

Initial release of extension


**Enjoy!**
