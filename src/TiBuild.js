"use strict";
const vscode = require("vscode");
var path = require('path');
var shell = require('shelljs');
var project_flag = ' --project-dir "' + vscode.workspace.rootPath + '"';
var info;
var logConnectAttempts = 120;
var defaultLoggerPort = 42336;
shell.exec("ti info -o json -t ios", function (code, output) {
    console.log("activated");
    info = JSON.parse(output);
});
function getProjectConfig() {
    return new Promise((resolve, reject) => {
        console.log('ti project -o json' + project_flag);
        shell.exec('ti project -o json' + project_flag, function (code, output) {
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
var BuildOption;
(function (BuildOption) {
    BuildOption[BuildOption["Normal"] = 0] = "Normal";
    BuildOption[BuildOption["Shadow"] = 1] = "Shadow";
    BuildOption[BuildOption["Appify"] = 2] = "Appify";
})(BuildOption = exports.BuildOption || (exports.BuildOption = {}));
var extra_flags_map = {
    [BuildOption.Normal]: "",
    [BuildOption.Shadow]: " --shadow",
    [BuildOption.Appify]: " --appify",
};
class TiBuild {
    constructor(type = BuildOption.Normal) {
        this.type = type;
    }
    reinitLogger(channel, logPort, initCount) {
        if (channel == undefined) {
            channel = vscode.window.createOutputChannel("ti_log");
            channel.show();
        }

        if (logPort == undefined) {
            logPort = defaultLoggerPort;
        }

        if (initCount == undefined) {
            initCount = logConnectAttempts;
        } else if (initCount < 0) {
            channel.appendLine('Can`t connect to logger, exit. You can connect to logger manually. Command "EA: Connect to logger"');
            return;
        }

        let self = this;
        let command = 'nc 127.0.0.1 ' + logPort;
        channel.appendLine('Reconnect to logger, ' + initCount + ' sec left');
        var nc = shell.exec(command, { async: true });
        nc.stdout.on('end', function () {
            setTimeout(function(){
                self.reinitLogger(channel, logPort, --initCount);
            }, 1000);
        });
        nc.stdout.on('data', function (data) {
            if (initCount < logConnectAttempts) {
                initCount = logConnectAttempts;
            }

            channel.append(data);
        });
    }
    executeTiCommand(c) {
        console.log(info);
        let self = this;
        let channel = vscode.window.createOutputChannel("titanium");
        let logPort = null;
        let command = 'cd "' + vscode.workspace.rootPath + '" && ' +
            'ti ' + c + project_flag
            + ' -s ' + this.tiapp['sdk-version']
            + extra_flags_map[this.type];
        console.log(command);
        var ti_command = shell.exec(command, { async: true });
        ti_command.stdout.on('data', function (data) {
            if (data.indexOf('Trying to connect to log server port') != -1) {
                logPort = data.split('port ')[1].replace('...', '');
                console.log('Logger port: ' + logPort);
            }

            channel.append(data);

            if (data.indexOf('End simulator log') != -1) {
                channel.appendLine('Reinit log connection');
                self.reinitLogger(channel, logPort);
            }
        });
        ti_command.stderr.on('data', function (data) {
            channel.append(data);
        });
        channel.show();
    }
    
    launchIosSim(family, selected) {
        if (selected) {
            return this.executeTiCommand('build -p ios -F ' + family + ' -T simulator -C "' + selected + '"');
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
    launchIosSimWithParams(family, selected) {
        if (selected) {
            return this.executeTiCommand('build -p ios -F ' + family + ' -T simulator -C "' + selected + '"');
        }
        var simulators = Object
            .keys(info.ios.simulators.ios)
            .reduce((acc, ver) => acc.concat(info.ios.simulators.ios[ver]), [])
            .filter(o => o.family === family);
        if (simulators.length === 0) {
            return vscode.window.showErrorMessage("No Ios simulators found");
        }
        if (simulators.length === 1) {
            return this.launchIosSim(family, simulators[0].udid);
        }
        return vscode.window.showQuickPick(simulators.map(a => a.name + " (" + a.version + ")"))
            .then(s => this.launchIosSim(family, simulators.find(a => a.name === s.split(" (")[0]).udid));
    }
    launchIosDevice(profile_uuid, device) {
        if (device) {
            return this.executeTiCommand('build -p ios  -T device -P "' + profile_uuid + '" -C "' + device + '"');
        }
        if (info.ios.devices.length === 0) {
            return this.launchIosDevice(profile_uuid, info.ios.device[0].udid);
        }
        return vscode.window.showQuickPick(info.ios.devices.map(a => a.name))
            .then(s => this.launchIosDevice(profile_uuid, info.ios.devices.find(a => a.name === s).udid));
    }
    launchDevice(platform) {
        var dev_profiles = info.ios.provisioning.development
            .filter(o => !o.expired && !o.invalid)
            .filter(o => this.tiapp['id'].indexOf(o.appId.replace(/\*/g, "")) !== -1);
        return vscode.window.showQuickPick(dev_profiles.map(a => a.uuid + " " + a.name))
            .then(s => {
            let profile = dev_profiles.find(a => a.uuid === s.split(" ")[0]);
            return this.launchIosDevice(profile.uuid);
        });
    }
    launchIosDist(target) {
        var profiles = info.ios.provisioning[target.replace("dist-", "")]
            .filter(o => !o.expired && !o.invalid)
            .filter(o => this.tiapp['id'].indexOf(o.appId.replace(/\*/g, "")) !== -1);
        return vscode.window.showQuickPick(profiles.map(a => a.uuid + " " + a.name))
            .then(s => {
            let profile = profiles.find(a => a.uuid === s.split(" ")[0]);
            return this.executeTiCommand('build -p ios  -T ' + target + ' -P "' + profile.uuid + '"' + ' -O dist');
        });
    }
    launchWithParams() {
        var platform;
        var target;
        var device_id;
        return getProjectConfig()
            .then(_tiapp => {
            this.tiapp = _tiapp;

            var targets = Object.keys(this.tiapp["deployment-targets"]).filter(a => this.tiapp["deployment-targets"][a]);
            return vscode.window.showQuickPick(targets);
        })
            .then((_platform) => {
            platform = _platform;
            return vscode.window.showQuickPick(["simulator", "device", ...["dist-adhoc", "dist-appstore"]]);
        })
            .then(_target => {
            target = _target;
            if (target === "simulator") {
                return this.launchIosSimWithParams(platform);
            }
            else if (target === "device") {
                return this.launchDevice(platform);
            }
            else {
                return this.launchIosDist(target);
            }
        });
    }
    launch() {
        var platform;
        var target;
        var device_id;
        let config = vscode.workspace.getConfiguration("eapackage");
        return getProjectConfig()
            .then(_tiapp => {
            this.tiapp = _tiapp;

            if(config["buildTarget"]) {
                return config["buildTarget"];
            }

            var targets = Object.keys(this.tiapp["deployment-targets"]).filter(a => this.tiapp["deployment-targets"][a]);
            return vscode.window.showQuickPick(targets);
        })
            .then((_platform) => {
            platform = _platform;

            if(config["buildPlatform"]) {
                return config["buildPlatform"];
            }

            return vscode.window.showQuickPick(["simulator", "device", ...["dist-adhoc", "dist-appstore"]]);
        })
            .then(_target => {
            target = _target;

            if (target === "simulator") {
                return this.launchIosSim(platform);
            }
            else if (target === "device") {
                return this.launchDevice(platform);
            }
            else {
                return this.launchIosDist(target);
            }
        });
    }
    clean() {
        return getProjectConfig()
            .then(_tiapp => {
            this.tiapp = _tiapp;
            return this.executeTiCommand('clean');
        });
    }
}
exports.TiBuild = TiBuild;
