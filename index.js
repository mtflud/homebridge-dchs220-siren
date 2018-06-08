/*
 * Copyright © 2018 Hector Mendoza. All rights reserved.
 * Homebridge plugin for D-Link DCH-S220 Wi-Fi enabled Siren.
 *
 */
'use strict'

let Service, Characteristic;
let Siren = require('./lib/Siren');

module.exports = (homebridge) => {
    Service = homebridge.hap.Service
    Characteristic = homebridge.hap.Characteristic

    homebridge.registerAccessory('homebridge-dchs220-siren', 'SirenSwitch', SirenSwitchAccessory)
}

class SirenSwitchAccessory {
    constructor(log, config) {
        this.log = log
        this.config = config || {};

        // :: Config parameters
        this.name = this.config.name || 'D-Link Siren';
        this.pin = this.config.pin || 123456;
        this.ipAddress = this.config.ipAddress || '127.0.0.1';
        this.sound = (this.config.sound && !isNaN(this.config.sound) && this.config.sound > 0 && this.config.sound < 7) ? this.config.sound : 1;
        this.volume = (this.config.volume && !isNaN(this.config.volume) && this.config.volume > 0 && this.config.volume <= 100) ? this.config.volume : 100;
        this.duration = (this.config.duration && !isNaN(this.config.duration) && this.config.duration > 0 && this.config.duration <= 88888) ? this.config.duration : 88888;
        this.sirenClient = new Siren(this.ipAddress, this.pin);
        this.updateInterval = (this.config.updateInterval && !isNaN(this.config.updateInterval) && this.config.updateInterval >= 100) ? this.config.updateInterval : false;

        this.service = new Service.Switch(this.config.name)
    }

    getServices() {
        const informationService = new Service.AccessoryInformation()
            .setCharacteristic(Characteristic.Manufacturer, 'D-Link')
            .setCharacteristic(Characteristic.Model, 'DCH-S220')
            .setCharacteristic(Characteristic.SerialNumber, 'dlink-dch-s220-siren')

        this.service.getCharacteristic(Characteristic.On)
            .on('get', this.getOnCharacteristicHandler.bind(this))
            .on('set', this.setOnCharacteristicHandler.bind(this));

        // :: Fault status (Home does not seem to support it, but Eve app does)
        this.service.addOptionalCharacteristic(Characteristic.StatusFault);

        // :: Status polling
        if (this.updateInterval) {
            setInterval(() => {
                this.getStatus().then(status => {
                    this.service.getCharacteristic(Characteristic.On).setValue(status);
                }).catch(err => {
                    console.log(":: Error from status polling: " + err);
                });
            }, this.updateInterval);
        }

        return [informationService, this.service]
    }

    setOnCharacteristicHandler(value, callback) {
        // :: Log In to the Siren
        this.sirenClient.login().then(status => {
            if (status !== 'success') {
                this.log(":: An error occurred while logging in to the siren, please check the credentials in config.");
                this.service.getCharacteristic(Characteristic.StatusFault)
                    .updateValue(true);
                return callback(false);
            }
            // :: Play the Siren
            if (value === true) {
                this.sirenClient.play(this.sound, this.volume, this.duration).then(status => {
                    if (status === 'OK') {
                        this.service.getCharacteristic(Characteristic.StatusFault)
                            .updateValue(false);
                        return callback(null);
                    }
                    this.service.getCharacteristic(Characteristic.StatusFault)
                        .updateValue(true);
                    return callback(false);
                }).catch(err => {
                    this.log(":: An error occurred while playing the siren: " + err);
                    this.service.getCharacteristic(Characteristic.StatusFault)
                        .updateValue(true);
                    return callback(false);
                });
            }

            // :: Stop Playing the Siren
            if (value === false) {
                this.sirenClient.stop().then(status => {
                    if (status === 'OK') {
                        this.service.getCharacteristic(Characteristic.StatusFault)
                            .updateValue(false);
                        return callback(null);
                    }
                    this.service.getCharacteristic(Characteristic.StatusFault)
                        .updateValue(true);
                    return callback(false);
                }).catch(err => {
                    this.log(":: An error occurred while stopping the siren: " + err);
                    this.service.getCharacteristic(Characteristic.StatusFault)
                        .updateValue(true);
                    return callback(false);
                })
            }

        }).catch(err => {
            this.log(":: An error occurred while logging in to the siren: " + err);
            this.service.getCharacteristic(Characteristic.StatusFault)
                .updateValue(true);
            return callback(false);
        });
    }

    /*
     * Get the "playing" status of the siren
     */
    getStatus() {
        return new Promise((resolve, reject) => {
            // :: Log In to the Siren
            this.sirenClient.login().then(status => {
                if (status !== 'success') {
                    this.log(":: An error occurred while logging in to the siren, please check the credentials in config.");
                    return reject("Error while logging in to the siren.");
                }
                // :: Retrieve playing status
                this.sirenClient.getPlayingStatus().then(status => {
                    return resolve(status);
                }).catch(err => {
                    this.log(":: An error occurred while retrieving siren status: " + err);
                    return reject(err);
                });
            }).catch(err => {
                this.log(":: An error occurred while logging in to the siren: " + err);
                return reject(err);
            });
        });
    }

    getOnCharacteristicHandler(callback) {
        this.getStatus().then(status => {
            this.service.getCharacteristic(Characteristic.StatusFault)
                .updateValue(false);
            return callback(null, status);
        }).catch(err => {
            console.log(":: Error from status polling: " + err);
            this.service.getCharacteristic(Characteristic.StatusFault)
                .updateValue(true);
            return callback(false);
        });
    }

}