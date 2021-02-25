import { BaseAccessory } from './BaseAccessory';
import { Logger, PlatformAccessory } from 'homebridge';
import { Device, Room, WiserClient } from '@string-bean/drayton-wiser-client';
import { HAP } from 'homebridge/lib/api';
export declare class WiserThermostatAccessory extends BaseAccessory {
    private room;
    private device?;
    constructor(accessory: PlatformAccessory, hap: HAP, log: Logger, client: WiserClient, room: Room, device?: Device | undefined);
    update(room: Room, device?: Device): void;
    private setTargetState;
    private setTargetTemperature;
    private static roomTargetState;
    private static roomCurrentState;
    private static batteryLevel;
}
//# sourceMappingURL=WiserThermostatAccessory.d.ts.map