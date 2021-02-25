import { BaseAccessory } from './BaseAccessory';
import { Logger, PlatformAccessory } from 'homebridge';
import { HAP } from 'homebridge/lib/api';
import { WiserClient } from '@string-bean/drayton-wiser-client';
export declare class WiserAwaySwitch extends BaseAccessory {
    private away;
    constructor(accessory: PlatformAccessory, hap: HAP, log: Logger, client: WiserClient);
    update(away: boolean): void;
    private setAway;
}
//# sourceMappingURL=WiserAwaySwitch.d.ts.map