"use strict";
const vscode = require("vscode");
var shell = require('shelljs');
var project_flag = ' --project-dir "' + vscode.workspace.rootPath + '"';
var info;
var defaultLoggerPort = 42336;
let loggerPort = null;
var tiapp = {};
var ncLogger = null;
var tiLog = vscode.window.createOutputChannel("ti_log");
var lastCommand = {
    cmd: '',
    appc: false
};

function updateTiInfo() {
    return new Promise((resolve, reject) => {
        console.log('ti info -o json -t ios');
        shell.exec("ti info -o json -t ios", function (code, output) {
            info = JSON.parse(output);
            if (code === 0) {
                resolve(JSON.parse(output));
            }
            else {
                console.log(output);
                reject(output);
            }
        });
    });
}

function getProjectConfig() {
    return new Promise((resolve, reject) => {
        console.log('ti project -o json' + project_flag);
        shell.exec('ti project -o json' + project_flag, function (code, output) {
            if (code === 0) {
                try {
                    var tiappData = JSON.parse(output);
                    tiapp = tiappData;
                    resolve(tiappData);
                } catch (error) {
                    console.log(error);
                    reject(output);
                }
            }
            else {
                console.log(output);
                reject(output);
            }
        });
    });
}
var BuildOption;
(function (BuildOption) {
    BuildOption[BuildOption["Normal"] = 0] = "Normal";
    BuildOption[BuildOption["Shadow"] = 1] = "Shadow";
    BuildOption[BuildOption["Appify"] = 2] = "Appify";
})(BuildOption = exports.BuildOption || (exports.BuildOption = {}));
let channel = vscode.window.createOutputChannel("titanium");
class TiBuild {
    /**
     * reinitLogger - Reconnect to simulator logger
     * 
     * @api public
     */
    reinitLogger(logPort = defaultLoggerPort) {
        tiLog && tiLog.show();

        if (ncLogger && ncLogger.exitCode !== null) {
            ncLogger = null;
        }

        if (ncLogger && ncLogger.spawnargs && ncLogger.spawnargs[2].includes(logPort)) {
            return;
        }

        let command = 'nc 127.0.0.1 ' + logPort;
        tiLog.appendLine('Connect to logger on port: ' + logPort);
        ncLogger = shell.exec(command, { async: true });

        ncLogger.stdout.on('end', function () { // tslint:disable-line
            tiLog.appendLine('Logger was disconnected. You can connect to logger manually. Command "EA: Connect to logger"');
        });
        ncLogger.stdout.on('data', function (data) { // tslint:disable-line
            tiLog.append(data);
        });
    }

    initLogger() {
        this.reinitLogger(loggerPort ? loggerPort : defaultLoggerPort);
    }

    /**
     * executeTiCommand - Execute Titanium command
     * 
     * @param {String} cmd - Titanium command
     * @param {boolean} appc - Rum Titanium command through Appcelerator CLI
     * 
     * @api private
     */
    executeTiCommand(cmd, appc) {
        if (cmd.includes('build')) {
            lastCommand = {
                cmd: cmd,
                appc: appc
            };
        }

        let self = this;
        let command = 'cd "' + vscode.workspace.rootPath + '" && ' +
            (appc ? 'appc ' : '') + 'ti ' + cmd + project_flag
            + ' -s ' + tiapp['sdk-version'];
        console.log(command);
        channel.appendLine('Command: ' + command);
        var ti_command = shell.exec(command, { async: true });
        ti_command.stdout.on('data', function (data) { // tslint:disable-line
            if (data.includes('Trying to connect to log server port')) {
                loggerPort = data.split('port ')[1].replace('...', '');
                console.log('Logger port: ' + loggerPort);
            }

            channel.append(data);

            if (data.includes('End simulator log')) {
                channel.appendLine('Logger was disconnected. You can connect to logger manually. Command "EA: Connect to logger"');
            }

            if (data.includes('Appcelerator Login required to continue') || data.includes('Session invalid. Please log in again')) {
                self.killPS('ti build', true);
                self.login();
            }

        });

        ti_command.stderr.on('data', function (data) { // tslint:disable-line
            channel.append(data);

            if (data.includes('BUILD FAILED')) {
                setTimeout(function() {
                    channel.appendLine('Please try to clean project data. Command: "EA: Clean Titanium data"');
                }, 1000);
            }

            if (data.includes('Alloy compiler failed')) {
                channel.appendLine('Please try to clean project data. Command: "EA: Clean Titanium data"');
            }
            
            if (data.includes('Another process is currently bound to port')) {
                setTimeout(function() {
                    self.killPS('nc 127.0.0.1', true);
                    channel.appendLine('Logger process was killed.');
                    self.killPS('ti build', true);
                    channel.appendLine('Build process was killed.\n Please close Simulator and restart build. Command "EA: Restart last build"');
                }, 1000);
            }

            if (data.includes('Invalid developer certificate')) {
                channel.append('Please execute: "ti setup" in terminal and select "iOS Settings"');
            }
        });
        channel.show();
    }

    /**
     * executeLastBuild - Execute last build
     * 
     * @api public
     */
    executeLastBuild() {
        if (!lastCommand.cmd) {
            vscode.window.showInformationMessage('Last build params not found');
            return;
        }

        return updateTiInfo().then(getProjectConfig)
            .then(() => {
                this.executeTiCommand(lastCommand.cmd, lastCommand.appc);
            });
    }

    /**
     * login - Login to Appcelerator account
     * 
     * @api public
     */
    login() {
        let self = this;
        channel.show();
        channel.appendLine('Please enter Appcelerator Login');
        vscode.window.showInputBox({
            prompt: 'Please enter Appcelerator Login'
        }).then(login => {
            channel.appendLine('Please enter Appcelerator Password');
            vscode.window.showInputBox({
                prompt: 'Please enter Appcelerator Password',
                password: true
            }).then(password => {
                var command = 'appc --username "' + login + '" --password "' + (password || '') + '" login';
                
                channel.appendLine('appc --username "' + login + '" --password "**********" login');
                var login_command = shell.exec(command, { async: true });

                login_command.stdout.on('data', function (data) { // tslint:disable-line
                    channel.append(data);

                    if (data.includes(login + ' logged into organization')) {
                        vscode.window.showInformationMessage('You are Logged in');
                        self.executeLastBuild();
                    }
                    
                });
            });
        });
    }

    /**
     * logout - Logout from Appcelerator account
     * 
     * @api public
     */
    logout() {
        channel.show();

        var command = 'appc logout';
        channel.appendLine(command);
        var login_command = shell.exec(command, { async: true });

        login_command.stdout.on('data', function (data) { // tslint:disable-line
            channel.append(data);
            if (data.includes('Logged Out')) {
                vscode.window.showInformationMessage('You are Logged out');
            }
        });
    }

    /**
     * killPS - Kill command from PS
     * 
     * @param {string} cmd - Command to kill
     * @param {boolean} hidden - Kill without information message
     * 
     * @api public
     */
    killPS(cmd, hidden) {
        channel.show();
        var stopCommand = shell.exec('PS -A | grep "' + cmd, { async: true });

        stopCommand.stdout.on('data', function (data) { // tslint:disable-line
            var pss = data.split('\n');
            pss.every(str => {
                if (str.includes(cmd)) {
                    var pid = str.split(' ')[0];

                    channel.appendLine('kill ' + pid);
                    shell.exec('kill ' + pid, { async: true });
                }
            });

            channel.appendLine('Build stopped');
            if (!hidden) {
                vscode.window.showInformationMessage('All builds stopped');
            }
        });
    }
    
    /**
     * launchIosSim - Build for IOS simulator, load params from configuration
     * 
     * @param {string} family - Device family (iphone, ipad, etc.)
     * @param {string} udid - Target simulator's UDID
     * 
     * @api private
     */
    launchIosSim(family, udid) {
        if (udid) {
            return this.executeTiCommand('build -p ios -F ' + family + ' -T simulator -C "' + udid + '" --log-level info', false);
        }
        let config = vscode.workspace.getConfiguration("eapackage");
        var simulators = Object
            .keys(info.ios.simulators.ios)
            .reduce((acc, ver) => acc.concat(info.ios.simulators.ios[ver]), []);
        
        var deviceTypes = [];
        var deviceNames = [];
        var iosVersions = [];
        simulators.map(function(simulator) {
            if (deviceTypes.indexOf(simulator.family) == -1) {
                deviceTypes.push(simulator.family);
            }
            if (deviceNames.indexOf(simulator.deviceName) == -1) {
                deviceNames.push(simulator.deviceName);
            }
            if (iosVersions.indexOf(simulator.version) == -1) {
                iosVersions.push(simulator.version);
            }
        });

        simulators = simulators.filter(o => o.family === family);
        
        if (simulators.length === 0) {
            return vscode.window.showErrorMessage("No Ios simulators found for this device type. Please use: " + deviceTypes.join(', '));
        }

        if(config["buildDevice"]) {
            simulators = simulators.filter(o => o.deviceName === config["buildDevice"]);
        }

        if (simulators.length === 0) {
            return vscode.window.showErrorMessage("No Ios simulators found for this device name. Please use: " + deviceNames.join(', '));
        }

        if(config["iosVersion"]) {
            simulators = simulators.filter(o => o.version === config["iosVersion"]);
        }

        if (simulators.length === 0) {
            return vscode.window.showErrorMessage("No Ios simulators found for this iOS version. Please use: " + iosVersions.join(', '));
        }
        

        if (simulators.length === 1) {
            return this.launchIosSim(family, simulators[0].udid);
        }
        return vscode.window.showQuickPick(simulators.map(a => a.name + " (" + a.version + ")"))
            .then(s => this.launchIosSim(family, simulators.find(a => a.name === s.split(" (")[0]).udid));
    }

    /**
     * launchIosSimWithParams - Build for IOS simulator, ask build params
     * 
     * @param {string} family - Device family (iphone, ipad, etc.)
     * @param {string} udid - Target simulator's UDID
     * 
     * @api private
     */
    launchIosSimWithParams(family, udid) {
        if (udid) {
            return this.launchIosSim(family, udid);
        }
        var simulators = Object
            .keys(info.ios.simulators.ios)
            .reduce((acc, ver) => acc.concat(info.ios.simulators.ios[ver]), [])
            .filter(o => o.family === family);
        if (simulators.length === 0) {
            return vscode.window.showErrorMessage("No iOS simulators found");
        }
        if (simulators.length === 1) {
            return this.launchIosSim(family, simulators[0].udid);
        }
        return vscode.window.showQuickPick(simulators.map(a => a.name + " (" + a.version + ")"))
            .then(device => {
                if (!device) return;

                this.launchIosSim(family, simulators.find(a => a.name === device.split(" (")[0]).udid)
            });
    }

    /**
     * launchIosDevice - Build for IOS device. Show device picker, if device not selected
     * 
     * @param {string} profile_uuid - Provision profile UUID
     * @param {string} certName - Certificate name
     * @param {string} deviceUDID - Target device UDID
     * 
     * @api private
     */
    launchIosDevice(profile_uuid, certName, deviceUDID) {
        if (deviceUDID) {
            return this.executeTiCommand('build -p ios  -T device -V "' + certName + '" -P "' + profile_uuid + '" -C "' + deviceUDID + '" --no-prompt --skip-js-minify --log-level info', true);
        }
        if (info.ios.devices.length === 1) {
            channel.appendLine('Found only one device. Selected: ' + info.ios.devices[0].name + ' UDID: ' + info.ios.devices[0].name);
            vscode.window.showInformationMessage('Found only one device. Selected: ' + info.ios.devices[0].name);

            return this.launchIosDevice(profile_uuid, certName, info.ios.devices[0].udid);
        }
        return vscode.window.showQuickPick(info.ios.devices.map(a => a.name))
            .then(s => this.launchIosDevice(profile_uuid, certName, info.ios.devices.find(a => a.name === s).udid));
    }

    /**
     * launchDevice - Prepare params for build to IOS device. Show certificate and provision pickers.
     * 
     * @api private
     */
    launchDevice() {
        var certs = Object
            .keys(info.ios.certs.keychains);
        
        if (certs.length == 0 || info.ios.certs.keychains[certs[0]].developer.length == 0) {
            vscode.window.showInformationMessage('Developer certificate not found! Please execute: "ti setup" in terminal and select "iOS Settings"');
        } else {
            return vscode.window.showQuickPick(info.ios.certs.keychains[certs[0]].developer.map(a => a.name))
            .then(certName => {
                if (!certName) return;
                
                var dev_profiles = info.ios.provisioning.development
                    .filter(o => !o.expired && !o.invalid)
                    .filter(o => tiapp['id'].includes(o.appId.replace(/\*/g, "")));
                return vscode.window.showQuickPick(dev_profiles.map(a => a.uuid + " " + a.name))
                .then(s => {
                    if (!s) return;

                    let profile = dev_profiles.find(a => a.uuid === s.split(" ")[0]);
                    return this.launchIosDevice(profile.uuid, certName, null);
                });
            });
        }
    }

    /**
     * launchIosDist - Build to package. Show provision picker.
     * 
     * @api private
     */
    launchIosDist(distType) {
        var provisions = info.ios.provisioning[distType.replace("dist-", "")]
            .filter(o => !o.expired && !o.invalid)
            .filter(o => tiapp['id'].includes(o.appId.replace(/\*/g, "")));
        return vscode.window.showQuickPick(provisions.map(a => a.uuid + " " + a.name))
        .then(profileName => {
            if (!profileName) return;

            let provision = provisions.find(a => a.uuid === profileName.split(" ")[0]);

            if (!provision) {
                vscode.window.showErrorMessage("Provision not found.");
                return;
            }

            return this.executeTiCommand('build -p ios  -T ' + distType + ' -P "' + provision.uuid + '"' + ' -O dist --deploy-type production --no-prompt --skip-js-minify --log-level info', true);
        });
    }

    /**
     * launchWithParams - Prepare params for Build. Show deviceFamily and target pickers.
     * 
     * @api public
     */
    launchWithParams() {
        var deploymentTarget;
        return updateTiInfo().then(inf => {
            return getProjectConfig()
            .then(this.showDeploymentTargetPicker)
            .then((_deploymentTarget) => {
                if (!_deploymentTarget) return;

                deploymentTarget = _deploymentTarget;
                return this.showBuildTypePicker();
            })
            .then(buildType => {
                if (!buildType) return;

                switch (buildType) {
                    case 'simulator':
                        return this.launchIosSimWithParams(deploymentTarget, null);
                    case 'device':
                        return this.launchDevice();
                    default:
                        return this.launchIosDist(buildType);
                }
            });
        });
    }

    /**
     * launch - Start build with saved params.
     * 
     * @api public
     */
    launch() {
        var deploymentTarget;
        let config = vscode.workspace.getConfiguration("eapackage");
        return updateTiInfo().then(inf => {
            return getProjectConfig()
                .then(() => {
                    return config["buildTarget"] ? config["buildTarget"] : this.showDeploymentTargetPicker();
                })
                .then((_deploymentTarget) => {
                    deploymentTarget = _deploymentTarget;
                    return config["buildPlatform"] ? config["buildPlatform"] : this.showBuildTypePicker();
                })
                .then(buildType => {
                    switch (buildType) {
                        case 'simulator':
                            return this.launchIosSim(deploymentTarget, null);
                        case 'device':
                            return this.launchDevice();
                        default:
                            return this.launchIosDist(buildType);
                    }
                });
        });
    }

    /**
     * showDeploymentTargetPicker - Show deployment target picker
     * 
     * @api private
     */
    showDeploymentTargetPicker() {
        var availableTargets = Object.keys(tiapp["deployment-targets"]).filter(a => tiapp["deployment-targets"][a]);
        return vscode.window.showQuickPick(availableTargets);
    }

    /**
     * showBuildTypePicker - Show build type picker
     * 
     * @api private
     */
    showBuildTypePicker() {
        return vscode.window.showQuickPick(["simulator", "device", ...["dist-adhoc", "dist-enterprise", "dist-distribution", "dist-appstore"]]);
    }

    /**
     * clean - Clean build data.
     * 
     * @api public
     */
    clean() {
        return getProjectConfig()
            .then(() => {
            return this.executeTiCommand('clean', false);
        });
    }
}
exports.TiBuild = TiBuild;
