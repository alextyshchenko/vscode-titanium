// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require('fs');
const Ti = require("./src/TiBuild");
var shell = require('shelljs');

function activate(context) {
    let mainChannel = vscode.window.createOutputChannel("ea");
    function writeInfo(text) {
        mainChannel.appendLine('[INFO]: ' + text);
    }
    function writeError(text) {
        mainChannel.appendLine('[ERROR]: ' + text);
    }

    console.log('endless-aisle-package is active!');

    console.log('Init vscode-icons');
    writeInfo('Init vscode-icons');
    vscode.commands.executeCommand('vscode-icons.activateIcons');
    writeInfo('vscode-icons activated');

    context.subscriptions.push(vscode.commands.registerCommand('eapackage.tiBuild', () => {
        mainChannel.show();

        var buildTime = new Date();
        var min = buildTime.getMinutes();
        var timeStr = buildTime.getHours() + ':' + ((min < 10) ? '0' + min : min);

        checkAlloyHooks(function() {
            writeInfo('Build started ' + timeStr);
            return new Ti.TiBuild().launch();
        }, function() {
            writeInfo('ERROR - Build failed ' + timeStr);
        });
    }));

    context.subscriptions.push(vscode.commands.registerCommand('eapackage.tiParamsBuild', () => {
        mainChannel.show();

        var buildTime = new Date();
        var min = buildTime.getMinutes();
        var timeStr = buildTime.getHours() + ':' + ((min < 10) ? '0' + min : min);

        checkAlloyHooks(function() {
            writeInfo('Build with params started ' + timeStr);
            return new Ti.TiBuild().launchWithParams();
        }, function() {
            writeInfo('ERROR - Build failed ' + timeStr);
        });
    }));

    context.subscriptions.push(vscode.commands.registerCommand('eapackage.tiClean', () => {
        return new Ti.TiBuild().clean();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('eapackage.appcLogin', () => {
        return new Ti.TiBuild().login();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('eapackage.appcLogout', () => {
        return new Ti.TiBuild().logout();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('eapackage.connectLogger', () => {
        return new Ti.TiBuild().initLogger();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('eapackage.tiStopBuild', () => {
        return new Ti.TiBuild().killPS('ti build', false);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('eapackage.repeatLast', () => {
        return new Ti.TiBuild().executeLastBuild();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('eapackage.showTiapp', () => {
        return showTiappPreview();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('eapackage.uploadToDiawi', () => {
        return new Ti.TiBuild().uploadToDiawi();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('eapackage.updateSdk', () => { 
        shell.exec("appc ti sdk install", function (code, output) {
            if (!output.includes("New version available!")) {
                writeInfo('New version not found');
                vscode.window.showInformationMessage('New version not found');
            }
        });
    }));

    if (vscode.workspace.workspaceFolders == undefined) {
        return;
    }


    var projectRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
    projectRoot = projectRoot.replace(/\\/g, "/");

    if (!projectRoot.endsWith("/")) projectRoot += '/';

    context.subscriptions.push(vscode.commands.registerCommand('eapackage.init', function (params) {
        mainChannel.show();

        writeInfo('Checking opened directory');
        var tiapp = projectRoot + 'tiapp.xml';
        fs.exists(tiapp, (exists) => {
            if (exists) {
                writeInfo('OK - tiapp.xml is exist.');
            } else {
                writeError('ERROR - tiapp.xml not found');
            }
        });

        writeInfo('Checking jsbeautify configuration');
        var jsbeautifyrc = projectRoot + '.jsbeautifyrc';
        fs.exists(jsbeautifyrc, (exists) => {
            if (exists) {
                writeInfo('OK - jsbeautify config ' + jsbeautifyrc + ' is exist');
            } else {
                fs.writeFile(jsbeautifyrc, '{\n    "space_after_anon_function": false\n}', function(err) {
                    if(err) {
                        writeError('ERROR - ' + jsbeautifyrc + ' creating error. \n' + err);
                        return vscode.window.showErrorMessage(jsbeautifyrc + ' creating error. \n' + err);
                    }
                    writeInfo('OK - jsbeautify config ' + jsbeautifyrc + ' created');
                });
            }
        });

        writeInfo('Checking eslint configuration');
        var eslintignore = projectRoot + '.eslintignore';
        fs.exists(eslintignore, (exists) => {
            if (exists) {
                writeInfo('OK - eslintignore config ' + eslintignore + ' is exist');
            } else {
                fs.writeFile(eslintignore, 'gulpfile.js\nnode_modules/\n', function(err) {
                    if(err) {
                        writeError('ERROR - ' + eslintignore + ' creating error. \n' + err);
                        return vscode.window.showErrorMessage(eslintignore + ' creating error. \n' + err);
                    }
                    writeInfo('OK - eslintignore config ' + eslintignore + ' created');
                });
            }
        });

        var eslintrc = projectRoot + '.eslintrc.json';
        fs.exists(eslintrc, (exists) => {
            if (exists) {
                writeInfo('OK - eslint config ' + eslintrc + ' is exist');
            } else {
                fs.writeFile(eslintrc, '{\n    "env": {\n      "browser": true\n    },\n    "extends": [\n      "eslint:recommended",\n      "plugin:backbone/recommended"\n    ],\n    "rules": {\n      "accessor-pairs": 2,\n      "array-bracket-spacing": 2,\n      "backbone/model-defaults": 0,\n      "brace-style": 2,\n      "comma-spacing": 2,\n      "complexity": 2,\n      "consistent-return": 0,\n      "curly": 2,\n      "eqeqeq": 0,\n      "func-names": 0,\n      "generator-star-spacing": 2,\n      "id-length": 0,\n      "id-match": 2,\n      "indent": [\n        2,\n        4,\n        {\n          "SwitchCase": 1\n        }\n      ],\n      "init-declarations": 0,\n      "jsx-quotes": 2,\n      "keyword-spacing": [\n        2,\n        {\n          "after": true,\n          "before": true\n        }\n      ],\n      "lines-around-comment": 0,\n      "max-len": 0,\n      "max-nested-callbacks": 2,\n      "new-parens": 2,\n      "newline-after-var": 0,\n      "no-array-constructor": 2,\n      "no-catch-shadow": 2,\n      "no-confusing-arrow": 2,\n      "no-constant-condition": 2,\n      "no-div-regex": 2,\n      "no-else-return": 0,\n      "no-eq-null": 2,\n      "no-eval": 2,\n      "no-extend-native": 2,\n      "no-extra-parens": 0,\n      "no-floating-decimal": 2,\n      "no-implied-eval": 2,\n      "no-inline-comments": 0,\n      "no-iterator": 2,\n      "no-label-var": 2,\n      "no-labels": 2,\n      "no-lone-blocks": 2,\n      "no-loop-func": 2,\n      "no-magic-numbers": 0,\n      "no-mixed-requires": 2,\n      "no-multi-spaces": 0,\n      "no-native-reassign": 2,\n      "no-negated-condition": 0,\n      "no-nested-ternary": 2,\n      "no-new-func": 2,\n      "no-new-object": 2,\n      "no-new-require": 2,\n      "no-new-wrappers": 2,\n      "no-octal-escape": 2,\n      "no-param-reassign": 0,\n      "no-path-concat": 2,\n      "no-process-exit": 2,\n      "no-proto": 2,\n      "no-restricted-modules": 2,\n      "no-restricted-syntax": 2,\n      "no-script-url": 2,\n      "no-self-compare": 2,\n      "no-sequences": 2,\n      "no-shadow": 0,\n      "no-shadow-restricted-names": 2,\n      "no-sync": 2,\n      "no-ternary": 0,\n      "no-throw-literal": 2,\n      "no-trailing-spaces": 2,\n      "no-undef-init": 2,\n      "no-undefined": 2,\n      "no-underscore-dangle": 0,\n      "no-use-before-define": [\n        2,\n        {\n          "functions": false\n        }\n      ],\n      "no-useless-concat": 2,\n      "no-var": 0,\n      "no-void": 2,\n      "no-warning-comments": 0,\n      "no-with": 2,\n      "object-curly-spacing": 2,\n      "object-shorthand": 0,\n      "one-var": 0,\n      "operator-linebreak": 2,\n      "padded-blocks": 0,\n      "prefer-arrow-callback": 0,\n      "prefer-reflect": 0,\n      "prefer-rest-params": 0,\n      "prefer-template": 0,\n      "quotes": [\n        2,\n        "single",\n        {\n          "avoidEscape": true\n        }\n      ],\n      "quote-props": 0,\n      "require-jsdoc": 0,\n      "require-yield": 2,\n      "semi": 2,\n      "space-before-function-paren": [\n        2,\n        {\n          "anonymous": "never",\n          "named": "never",\n          "asyncArrow": "ignore"\n        }\n      ],\n      "space-in-parens": 2,\n      "space-infix-ops": 2,\n      "spaced-comment": 0,\n      "valid-jsdoc": 0,\n      "vars-on-top": 0,\n      "yoda": 2\n    },\n    "globals": {\n      "require": true,\n      "exports": true,\n      "module": true,\n      "Ti": true,\n      "_L": true,\n      "L": true,\n      "$": true,\n      "_UP": true,\n      "$model": true,\n      "allowAppSleep": true,\n      "Titanium": true,\n      "Alloy": true,\n      "ucfirst": true,\n      "getFullControllerPath": true,\n      "supportLog": true,\n      "setRuntimeLoggableCategories": true,\n      "getLoggableCategories": true,\n      "removeAllChildren": true,\n      "notify": true,\n      "removeNotify": true,\n      "isKioskMode": true,\n      "isKioskManagerLoggedIn": true,\n      "isKioskCartEnabled": true,\n      "getKioskManager": true,\n      "recordHistoryEvent": true,\n      "arguments": true,\n      "urlError": true,\n      "moment": true\n    }\n}\n', function(err) {
                    if(err) {
                        writeError('ERROR - ' + eslintrc + ' creating error. \n' + err);
                        return vscode.window.showErrorMessage(eslintrc + ' creating error. \n' + err);
                    }
                    writeInfo('OK - eslint config ' + eslintrc + ' created');
                });
            }
        });

        writeInfo('Checking alloy');
        shell.exec("/usr/local/bin/alloy", function (code, output) {
            if (output.includes('Alloy command line')) {
                console.log("Alloy installed");
                writeInfo('OK - Alloy installed');
            } else {
                writeInfo('WARN - Alloy not installed');
                vscode.window.showInformationMessage("Alloy not installed");
                console.log("Alloy not installed");

                vscode.window.showQuickPick(["Install Alloy", "Skip"]).then(value => {
                    if (value == "Install Alloy") {
                        writeInfo('Alloy instalation: npm install -g alloy');
                        shell.exec("npm install -g alloy", function (code, output) {
                            if (output.includes("+ alloy@")) {
                                writeInfo('Alloy installed successful');
                                vscode.window.showInformationMessage('Alloy installed successful');
                            } else {
                                writeError('ERROR - Alloy not installed. Please execute command in terminal: npm install -g alloy');
                                vscode.window.showErrorMessage('Alloy not installed. Please execute command in terminal: "npm install -g alloy" or "sudo npm install -g alloy"');
                            }
                        });
                    }
                });
            }
        });

        writeInfo('Checking Titanium CLI');
        shell.exec("ti", function (code, output) {
            if (output.includes('Titanium Command-Line Interface')) {
                console.log("Titanium Command-Line Interface installed");
                writeInfo('OK - Titanium Command-Line Interface installed');
            } else {
                writeInfo('WARN - Titanium Command-Line Interface not installed');
                vscode.window.showInformationMessage("Titanium Command-Line Interface not installed");
                console.log("Titanium Command-Line Interface not installed");

                vscode.window.showQuickPick(["Install Titanium CLI", "Skip"]).then(value => {
                    if (value == "Install Titanium CLI") {
                        writeInfo('Еitanium instalation: npm install -g titanium');
                        shell.exec("npm install -g titanium", function (code, output) {
                            if (output.includes("+ titanium@")) {
                                writeInfo('Titanium CLI installed successful');
                                vscode.window.showInformationMessage('Alloy CLI installed successful');
                            } else {
                                writeError('ERROR - Titanium CLI not installed. Please execute command in terminal: npm install -g titanium');
                                vscode.window.showErrorMessage('Titanium CLI not installed. Please execute command in terminal: "npm install -g titanium" or "sudo npm install -g titanium"');
                            }
                        });
                    }
                });
            }
        });

        shell.exec("appc", function (code, output) {
            if (output.includes('Appcelerator Command-Line Interface')) {
                console.log("Appcelerator Command-Line Interface installed");
                writeInfo('OK - Appcelerator Command-Line Interface installed');
            } else {
                writeInfo('WARN - Appcelerator Command-Line Interface not installed, command "appc" not available');
                vscode.window.showInformationMessage("Appcelerator Command-Line Interface not installed");
                console.log("Appcelerator Command-Line Interface not installed");

                writeInfo('Please follow this instruction: https://docs.appcelerator.com/platform/latest/#!/guide/Titanium_Command-Line_Interface_Reference-section-src-35619828_TitaniumCommand-LineInterfaceReference-InstallandconfiguretheCLI');
            }
        });

        writeInfo('Checking finished');
    }));


    function checkAlloyHooks(success, fail) {
        var alloy = projectRoot + '/plugins/ti.alloy/hooks/alloy.js';
        fs.exists(alloy, (exists) => {
            if (exists) {
                var deepclean = projectRoot + '/plugins/ti.alloy/hooks/deepclean.js';
                fs.exists(deepclean, (exists) => {
                    if (exists) {
                        if (typeof success === 'function') {
                            success();
                        }
                    } else {
                        writeInfo('ERROR - /plugins/ti.alloy/hooks/deepclean.js not found.');
                        vscode.window.showErrorMessage('/plugins/ti.alloy/hooks/deepclean.js not found.');
                        if (typeof fail === 'function') {
                            fail();
                        }
                    }
                });
            } else {
                writeInfo('ERROR - /plugins/ti.alloy/hooks/alloy.js not found.');
                vscode.window.showErrorMessage('/plugins/ti.alloy/hooks/alloy.js not found.');
                if (typeof fail === 'function') {
                    fail();
                }
            }
        });
    }


    function showTiappPreview() {
        var tiBuild = new Ti.TiBuild();
        var tiappInfo = {};
        var tiInfo = {};
        
        tiBuild.getTiInfo().then(function(data) {
            tiInfo = data;
        }).then(tiBuild.getProjectConfig).then(function(data) {
            tiappInfo = data;
        }).then(function() {
            const panel = vscode.window.createWebviewPanel('tiappPreview', "Tiapp preview", vscode.ViewColumn.Two, {});
            panel.webview.html = getWebviewContent();
        });
        
        function prepareObject (obj, lvl = 0) {
            lvl++;
            var content = '';

            if (lvl > 5) return '';
            Object.keys(obj).forEach(function(key) {
                if (skipList(key)) {
                    if (typeof obj[key] == 'object') {
                        content = content + prepareObject(obj[key], lvl);
                    }
                } else {
                    switch (typeof obj[key]) {
                        case 'object':
                            content = content + '<div><h3>' + key + '</h3><div style="padding-left: 30px;">' + prepareObject(obj[key], lvl) + '</div></div>';
                            break;

                        case 'boolean':
                            content = content + '<div><h4 style="color:' + (obj[key] ? 'green' : 'red') + ';">' + key + ': </h4><input type="checkbox" ' + (obj[key] ? 'checked' : '') + ' disabled="true" /></div>';
                            break;
                    
                        default:
                            content = content + '<div><h4 style="' + ((obj[key].length == 0) ? 'color: red;' : '') + '">' + key + ': </h4><span>' + obj[key] + '</span></div>';
                            break;
                    }
                }
            });

            return content;
        }

        function skipList(key) {
            switch (key) {
                case 'ios':
                case 'managed':
                    return true;
                default:
                    return false;
                    break;
            }
        }

        function getWebviewContent() {
            return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Cat Coding</title>

                <style>
                 div {
                     margin-top: 5px;
                 }
                 h4 {
                    display: inline;
                 }
                </style>
            </head>
            <body>
                ${prepareObject(tiappInfo)}
            </body>
            </html>`;
            }
        
    }
}
exports.activate = activate;
