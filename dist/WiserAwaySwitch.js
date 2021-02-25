"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WiserAwaySwitch = void 0;
const BaseAccessory_1 = require("./BaseAccessory");
class WiserAwaySwitch extends BaseAccessory_1.BaseAccessory {
    constructor(accessory, hap, log, client) {
        super(accessory, hap, log, client);
        this.away = false;
        const Characteristic = hap.Characteristic;
        this.registerCharacteristic({
            serviceType: this.hap.Service.Switch,
            characteristicType: Characteristic.On,
            getter: () => this.away,
            setter: this.setAway.bind(this),
        });
    }
    update(away) {
        if (this.away !== away) {
            this.updateCharacteristic({
                serviceType: this.hap.Service.Switch,
                characteristicType: this.hap.Characteristic.On,
                value: away,
            });
            this.away = away;
        }
    }
    setAway(value) {
        let postUpdate;
        if (value === true) {
            postUpdate = this.client.enableAwayMode();
        }
        else {
            postUpdate = this.client.disableAwayMode();
        }
        return postUpdate.then((updated) => {
            this.update(updated.system.awayMode);
        });
    }
}
exports.WiserAwaySwitch = WiserAwaySwitch;
//# sourceMappingURL=WiserAwaySwitch.js.map