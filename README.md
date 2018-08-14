# Endless Aisle Package README

## Features

### Available commands

* `EA: Init workspace for Endless Aisle` - Activate extensions and create needed files
* `EA: Build Titanium application` - Build application with params from extension settings
* `EA: Build Titanium application with params` - Build application with promts
* `EA: Restart last build` - Restart build with last params
* `EA: Clean Titanium data` - Clean project data
* `EA: Connect to logger` - Connect to logger if simulator started
* `EA: Appcelerator login` - Login to Appcelerator account
* `EA: Appcelerator logout` - Logout from Appcelerator account
* `EA: Stop current build` - Stop current builds


### Available key bindings

* `cmd+shift+a` - Build application with params from extension settings
* `cmd+shift+l` - Connect to logger

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

### 1.0.1

Fixed issue with cmd+shift+c binding. Removed cmd+shift+i binding.

### 1.0.2

Fixed issue with device and dist builds. 
Updated feature "Init workspace for Endless Aisle"
Added features: Appcelerator login/logout, Build stop.

### 1.0.3

Fixed issue with logger.
Added features: Restart last build, Colors in console output.

### 1.0.4

Fixed some bugs.

**Enjoy!**
