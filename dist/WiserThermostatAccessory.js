"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WiserThermostatAccessory = void 0;
const BaseAccessory_1 = require("./BaseAccessory");
const drayton_wiser_client_1 = require("@string-bean/drayton-wiser-client");
const BatteryLevel_1 = require("@string-bean/drayton-wiser-client/dist/api/BatteryLevel");
class WiserThermostatAccessory extends BaseAccessory_1.BaseAccessory {
    constructor(accessory, hap, log, client, room, device) {
        super(accessory, hap, log, client);
        this.room = room;
        this.device = device;
        const Characteristic = hap.Characteristic;
        this.registerCharacteristic({
            serviceType: hap.Service.Thermostat,
            characteristicType: Characteristic.CurrentHeatingCoolingState,
            getter: () => WiserThermostatAccessory.roomCurrentState(this.room, this.hap),
            props: {
                validValues: [
                    Characteristic.CurrentHeatingCoolingState.HEAT,
                    Characteristic.CurrentHeatingCoolingState.OFF,
                ],
            },
        });
        this.registerCharacteristic({
            serviceType: hap.Service.Thermostat,
            characteristicType: Characteristic.TargetHeatingCoolingState,
            getter: () => WiserThermostatAccessory.roomTargetState(this.room, this.hap),
            setter: this.setTargetState.bind(this),
            props: {
                validValues: [
                    Characteristic.TargetHeatingCoolingState.OFF,
                    Characteristic.TargetHeatingCoolingState.HEAT,
                    Characteristic.TargetHeatingCoolingState.AUTO,
                ],
            },
        });
        this.registerCharacteristic({
            serviceType: hap.Service.Thermostat,
            characteristicType: Characteristic.CurrentTemperature,
            getter: () => {
                return this.room.temperature;
            },
        });
        this.registerCharacteristic({
            serviceType: hap.Service.Thermostat,
            characteristicType: Characteristic.TargetTemperature,
            getter: () => {
                return this.room.setTemperature;
            },
            setter: this.setTargetTemperature.bind(this),
            props: {
                minValue: 5,
                minStep: 0.5,
                maxValue: 30,
            },
        });
        this.registerCharacteristic({
            serviceType: hap.Service.Thermostat,
            characteristicType: Characteristic.TemperatureDisplayUnits,
            getter: () => Characteristic.TemperatureDisplayUnits.CELSIUS,
            setter: () => Promise.resolve(),
        });
        if (device) {
            this.registerCharacteristic({
                serviceType: hap.Service.BatteryService,
                characteristicType: Characteristic.BatteryLevel,
                getter: () => {
                    if (this.device) {
                        return WiserThermostatAccessory.batteryLevel(this.device);
                    }
                    else {
                        return 0;
                    }
                },
            });
            this.registerCharacteristic({
                serviceType: hap.Service.BatteryService,
                characteristicType: Characteristic.StatusLowBattery,
                getter: () => { var _a; return ((_a = this.device) === null || _a === void 0 ? void 0 : _a.batteryLevel) === BatteryLevel_1.BatteryLevel.Low; },
            });
        }
    }
    update(room, device) {
        var _a, _b;
        if (this.room.temperature !== room.temperature) {
            this.updateCharacteristic({
                serviceType: this.hap.Service.Thermostat,
                characteristicType: this.hap.Characteristic.CurrentTemperature,
                value: room.temperature ? room.temperature : 0,
            });
        }
        if (this.room.setTemperature !== room.setTemperature) {
            this.updateCharacteristic({
                serviceType: this.hap.Service.Thermostat,
                characteristicType: this.hap.Characteristic.TargetTemperature,
                value: room.temperature ? room.temperature : 0,
            });
        }
        if (this.room.active !== room.active) {
            this.updateCharacteristic({
                serviceType: this.hap.Service.Thermostat,
                characteristicType: this.hap.Characteristic.CurrentHeatingCoolingState,
                value: WiserThermostatAccessory.roomCurrentState(room, this.hap),
            });
        }
        if (this.room.mode !== room.mode) {
            this.updateCharacteristic({
                serviceType: this.hap.Service.Thermostat,
                characteristicType: this.hap.Characteristic.TargetHeatingCoolingState,
                value: WiserThermostatAccessory.roomTargetState(room, this.hap),
            });
        }
        this.room = room;
        if (device) {
            if (((_a = this.device) === null || _a === void 0 ? void 0 : _a.batteryLevel) !== device.batteryLevel) {
                this.updateCharacteristic({
                    serviceType: this.hap.Service.BatteryService,
                    characteristicType: this.hap.Characteristic.BatteryLevel,
                    value: (_b = WiserThermostatAccessory.batteryLevel(device)) !== null && _b !== void 0 ? _b : 0,
                });
                this.updateCharacteristic({
                    serviceType: this.hap.Service.BatteryService,
                    characteristicType: this.hap.Characteristic.StatusLowBattery,
                    value: device.batteryLevel === BatteryLevel_1.BatteryLevel.Low,
                });
            }
            this.device = device;
        }
    }
    setTargetState(value) {
        let postUpdate;
        switch (value) {
            case this.hap.Characteristic.TargetHeatingCoolingState.OFF:
                postUpdate = this.client.disableRoom(this.room.id);
                break;
            case this.hap.Characteristic.TargetHeatingCoolingState.HEAT:
                postUpdate = this.client.overrideRoomSetPoint(this.room.id, this.room.setTemperature);
                break;
            case this.hap.Characteristic.TargetHeatingCoolingState.AUTO:
            default:
                postUpdate = this.client.cancelRoomOverride(this.room.id);
        }
        return postUpdate.then((updated) => {
            this.update(updated);
        });
    }
    setTargetTemperature(value) {
        if (this.room.isValid) {
            return this.client
                .overrideRoomSetPoint(this.room.id, value)
                .then((updated) => {
                this.update(updated);
            });
        }
        else {
            return Promise.resolve();
        }
    }
    static roomTargetState(room, hap) {
        switch (room.mode) {
            case drayton_wiser_client_1.RoomMode.Off:
                return hap.Characteristic.TargetHeatingCoolingState.OFF;
            case drayton_wiser_client_1.RoomMode.Manual:
            case drayton_wiser_client_1.RoomMode.Boost:
                return hap.Characteristic.TargetHeatingCoolingState.HEAT;
            default:
                return hap.Characteristic.TargetHeatingCoolingState.AUTO;
        }
    }
    static roomCurrentState(room, hap) {
        if (room.active) {
            return hap.Characteristic.CurrentHeatingCoolingState.HEAT;
        }
        else {
            return hap.Characteristic.CurrentHeatingCoolingState.OFF;
        }
    }
    static batteryLevel(device) {
        switch (device === null || device === void 0 ? void 0 : device.batteryLevel) {
            case BatteryLevel_1.BatteryLevel.Normal:
                return 100;
            case BatteryLevel_1.BatteryLevel.TwoThirds:
                return 66;
            case BatteryLevel_1.BatteryLevel.OneThird:
                return 33;
            case BatteryLevel_1.BatteryLevel.Low:
                return 10;
            default:
                return undefined;
        }
    }
}
exports.WiserThermostatAccessory = WiserThermostatAccessory;
//# sourceMappingURL=WiserThermostatAccessory.js.map