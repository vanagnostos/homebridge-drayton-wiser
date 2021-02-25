"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WiserSmartPlugAccessory = void 0;
const BaseAccessory_1 = require("./BaseAccessory");
const drayton_wiser_client_1 = require("@string-bean/drayton-wiser-client");
class WiserSmartPlugAccessory extends BaseAccessory_1.BaseAccessory {
    constructor(accessory, hap, log, client, smartPlug) {
        super(accessory, hap, log, client);
        this.smartPlug = smartPlug;
        const Characteristic = hap.Characteristic;
        this.registerCharacteristic({
            serviceType: hap.Service.Outlet,
            characteristicType: Characteristic.On,
            getter: this.getPower.bind(this),
            setter: this.setPower.bind(this),
        });
        this.registerCharacteristic({
            serviceType: hap.Service.Outlet,
            characteristicType: Characteristic.OutletInUse,
            getter: this.getOutletInUse.bind(this)
        });
    }
    getOutletInUse(){
        return this.smartPlug.instantaneousDemand > 0;
    }
    getPower(){
        return this.smartPlug.outputState === 'On';
    }
    setPower(value){
        return this.client.setSmartPlugState(this.smartPlug.id, value).then((updated) => {
            this.update(updated);
        });
    }
    update(smartPlug) {
        // api returns stale statuses at moments
        // but target state is usually correct
        if(smartPlug.outputState !== smartPlug.targetState){
            smartPlug.outputState = smartPlug.targetState;
        }
        if(smartPlug.outputState !== this.smartPlug.outputState){
            this.updateCharacteristic({
                serviceType: this.hap.Service.Outlet,
                characteristicType: this.hap.Characteristic.On,
                value: smartPlug.outputState === 'On'
            });
        }
        if(smartPlug.instantaneousDemand !== this.smartPlug.instantaneousDemand){
            this.updateCharacteristic({
                serviceType: this.hap.Service.Outlet,
                characteristicType: this.hap.Characteristic.OutletInUse,
                value: smartPlug.instantaneousDemand > 0
            });
        }
        this.smartPlug = smartPlug;
    }
}
exports.WiserSmartPlugAccessory = WiserSmartPlugAccessory;
//# sourceMappingURL=WiserSmartPlugAccessory.js.map