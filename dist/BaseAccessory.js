"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAccessory = void 0;
class BaseAccessory {
    constructor(accessory, hap, log, client) {
        this.accessory = accessory;
        this.hap = hap;
        this.log = log;
        this.client = client;
    }
    getService(serviceType) {
        const service = this.accessory.getService(serviceType);
        if (service) {
            return service;
        }
        return this.accessory.addService(serviceType);
    }
    registerCharacteristic({ serviceType, characteristicType, getter, setter, props, }) {
        const service = this.getService(serviceType);
        const characteristic = service.getCharacteristic(characteristicType);
        if (getter) {
            characteristic.on('get', (callback) => {
                try {
                    callback(null, getter());
                }
                catch (error) {
                    callback(error);
                }
            });
        }
        if (setter) {
            characteristic.on('set', (value, callback) => {
                setter(value)
                    .then(() => {
                    callback();
                })
                    .catch((error) => {
                    callback(error);
                });
            });
        }
        if (props) {
            characteristic.setProps(props);
        }
    }
    updateCharacteristic({ serviceType, characteristicType, value, }) {
        this.getService(serviceType).updateCharacteristic(characteristicType, value);
    }
}
exports.BaseAccessory = BaseAccessory;
//# sourceMappingURL=BaseAccessory.js.map