"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WiserPlatformPlugin = void 0;
const rxjs_1 = require("rxjs");
const drayton_wiser_client_1 = require("@string-bean/drayton-wiser-client");
const WiserThermostatAccessory_1 = require("./WiserThermostatAccessory");
const WiserSmartPlugAccessory_1 = require("./WiserSmartPlugAccessory");
const WiserAwaySwitch_1 = require("./WiserAwaySwitch");
const POLL_INTERVAL = 60 * 1000;
class WiserPlatformPlugin {
    constructor(log, config, api) {
        this.log = log;
        this.config = config;
        this.api = api;
        // homebridge accessories
        this.accessories = new Map();
        // wiser accessory wrappers
        this.thermostats = new Map();
        this.smartPlugs = new Map();
        if (!config) {
            log.warn('Missing plugin config - please update config.json');
            return;
        }
        if (!config.secret) {
            log.warn('Invalid config - missing secret');
            return;
        }
        if (config.overrideAddress) {
            if (!config.address) {
                log.warn('Invalid config - overrideConfig is set without address');
                return;
            }
            this.wiserClient = drayton_wiser_client_1.WiserClient.clientWithAddress(config.secret, config.address);
        }
        else {
            this.wiserClient = drayton_wiser_client_1.WiserClient.clientWithDiscovery(config.secret, config.namePrefix);
        }
        this.hideAwayButton = config.hideAwayButton;
        log.info('Loading Drayton Wiser platform');
        api.on('didFinishLaunching', () => {
            this.updateSubscription = rxjs_1.timer(0, POLL_INTERVAL)
                .pipe()
                .subscribe(() => {
                this.log.debug('Polling system');
                this.updateSystem().catch((error) => {
                    this.log.error('Error during system update', error);
                });
            });
        });
        api.on('shutdown', () => {
            if (this.updateSubscription) {
                this.updateSubscription.unsubscribe();
            }
        });
    }
    configureAccessory(accessory) {
        this.accessories.set(accessory.UUID, accessory);
    }
    async updateSystem() {
        if (!this.wiserClient) {
            return;
        }
        const systemStatus = await this.wiserClient.fullStatus();
        const currentAccessories = [];
        await this.updateAway(systemStatus, currentAccessories);
        await this.updateRooms(systemStatus, currentAccessories);
        await this.updateSmartPlugs(systemStatus, currentAccessories);
        const staleAccessories = Array.from(this.accessories.values()).filter((existing) => !currentAccessories.find((current) => current.UUID === existing.UUID));
	      //  const staleAccessories = Array.from(this.accessories.values());
        if (staleAccessories.length) {
            this.log.info(`Removing ${staleAccessories.length} stale accessories`);
            this.api.unregisterPlatformAccessories('homebridge-drayton-wiser', 'drayton-wiser', staleAccessories);
        }
    }
    async updateAway(status, currentAccessories) {
        if (this.hideAwayButton) {
            return;
        }
        const uuid = this.api.hap.uuid.generate('drayton-wiser:1:away');
        if (!this.accessories.has(uuid)) {
            const accessory = new this.api.platformAccessory('Away Mode', uuid);
            this.accessories.set(uuid, accessory);
            this.api.registerPlatformAccessories('homebridge-drayton-wiser', 'drayton-wiser', [accessory]);
        }
        const awayAccessory = this.accessories.get(uuid);
        if (!this.awaySwitch) {
            this.awaySwitch = new WiserAwaySwitch_1.WiserAwaySwitch(awayAccessory, this.api.hap, this.log, this.wiserClient);
        }
        this.updateAccessoryInformation({
            accessory: awayAccessory,
            model: 'Wiser HeatHub',
            firmwareVersion: status.system.version,
            serial: status.zigbee.macAddress,
        });
        this.awaySwitch.update(status.system.awayMode);
        currentAccessories.push(awayAccessory);
    }
    async updateRooms(status, currentAccessories) {
        const rooms = status.rooms;
        const devices = status.devices;
        const thermostats = rooms
            .filter((room) => room.isValid)
            .map((room) => this.createThermostat(room, this.findRoomDevices(room, devices)));
        const newAccessories = thermostats
            .filter(([, isNew]) => isNew)
            .map(([accessory]) => accessory);
        if (newAccessories.length) {
            this.log.info(`Found ${newAccessories.length} new rooms`);
        }
        if (newAccessories.length) {
            this.api.registerPlatformAccessories('homebridge-drayton-wiser', 'drayton-wiser', newAccessories);
        }
        currentAccessories.push(...thermostats.map(([thermostat]) => thermostat));
    }
    async updateSmartPlugs(status, currentAccessories) {
        const plugs = status.smartPlugs;
        const devices = status.devices;
        const smartPlugs = plugs.map((plug) => this.createSmartPlug(plug));
        const newSmartPlugs = smartPlugs
          .filter(([, isNew]) => isNew)
          .map(([accessory]) => accessory);
        if (newSmartPlugs.length) {
            this.log.info(`Found ${newSmartPlugs.length} new smart plugs`);
            this.api.registerPlatformAccessories('homebridge-drayton-wiser', 'drayton-wiser', newSmartPlugs);
        }
        currentAccessories.push(...smartPlugs.map(([smartPlug]) => smartPlug));
    }
    findRoomDevices(room, devices) {
        const matched = devices.filter((device) => room.thermostatIds.includes(device.id));
        if (room.roomStatId) {
            devices.push(...devices.filter((device) => room.roomStatId === device.id));
        }
        return matched;
    }
    createSmartPlug(plug) {
        const uuid = this.api.hap.uuid.generate(`drayton-wiser:1:smartplug${plug.id}`),
              roomId = plug.roomId || 'UNKNOWN';
        this.log.debug(`configuring smart plug ${plug.id} room ${roomId} (${uuid})`);
        let newAccessory = false;
        if (!this.accessories.has(uuid)) {
            this.accessories.set(uuid, new this.api.platformAccessory(plug.name, uuid));
            newAccessory = true;
        }
        const accessory = this.accessories.get(uuid);
        this.updateAccessoryInformation({
            accessory,
            model: 'SmartPlug',
            serial: plug.serialNumber || 'UNKNOWN',
            firmwareVersion: 'UNKNOWN',
        });
        if (!this.smartPlugs.has(uuid)) {
            this.smartPlugs.set(uuid, new WiserSmartPlugAccessory_1.WiserSmartPlugAccessory(accessory, this.api.hap, this.log, this.wiserClient, plug));
        }
        const smartPlug = this.smartPlugs.get(uuid);
        smartPlug.update(plug);
        return [accessory, newAccessory];
    }
    createThermostat(room, roomDevices) {
        var _a, _b;
        const uuid = this.api.hap.uuid.generate(`drayton-wiser:1:${room.id}`);
        this.log.debug(`configuring thermostat ${room.id} (${uuid})`);
        let newAccessory = false;
        if (!this.accessories.has(uuid)) {
            this.accessories.set(uuid, new this.api.platformAccessory(room.name, uuid));
            newAccessory = true;
        }
        const accessory = this.accessories.get(uuid);
        // TODO implement configurable behaviour for this
        const primaryDevice = roomDevices[0];
        this.updateAccessoryInformation({
            accessory,
            model: 'iTRV',
            serial: (_a = primaryDevice === null || primaryDevice === void 0 ? void 0 : primaryDevice.serialNumber) !== null && _a !== void 0 ? _a : 'UNKNOWN',
            firmwareVersion: (_b = primaryDevice === null || primaryDevice === void 0 ? void 0 : primaryDevice.firmwareVersion) !== null && _b !== void 0 ? _b : 'UNKNOWN',
        });
        if (!this.thermostats.has(uuid)) {
            this.thermostats.set(uuid, new WiserThermostatAccessory_1.WiserThermostatAccessory(accessory, this.api.hap, this.log, this.wiserClient, room, primaryDevice));
        }
        const thermostat = this.thermostats.get(uuid);
        thermostat.update(room);
        return [accessory, newAccessory];
    }
    // TODO move into BaseAccessory
    updateAccessoryInformation({ accessory, model, serial, firmwareVersion, }) {
        const Characteristic = this.api.hap.Characteristic;
        WiserPlatformPlugin.getOrCreateService(accessory, this.api.hap.Service.AccessoryInformation)
            .setCharacteristic(Characteristic.Manufacturer, 'Drayton')
            .setCharacteristic(Characteristic.Model, model)
            .setCharacteristic(Characteristic.SerialNumber, serial)
            .setCharacteristic(Characteristic.FirmwareRevision, firmwareVersion);
    }
    // TODO wtf type should serviceType be?
    static getOrCreateService(accessory, serviceType) {
        const service = accessory.getService(serviceType);
        if (service) {
            return service;
        }
        return accessory.addService(serviceType);
    }
}
exports.WiserPlatformPlugin = WiserPlatformPlugin;
//# sourceMappingURL=WiserPlatformPlugin.js.map