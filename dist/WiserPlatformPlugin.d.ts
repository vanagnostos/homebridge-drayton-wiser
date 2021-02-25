import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig } from 'homebridge';
export declare class WiserPlatformPlugin implements DynamicPlatformPlugin {
    readonly log: Logger;
    readonly config: PlatformConfig;
    readonly api: API;
    private updateSubscription?;
    private readonly wiserClient?;
    private readonly hideAwayButton?;
    private readonly accessories;
    private readonly thermostats;
    private awaySwitch?;
    constructor(log: Logger, config: PlatformConfig, api: API);
    configureAccessory(accessory: PlatformAccessory): void;
    private updateSystem;
    private updateAway;
    private updateRooms;
    private findRoomDevices;
    private createThermostat;
    private updateAccessoryInformation;
    private static getOrCreateService;
}
//# sourceMappingURL=WiserPlatformPlugin.d.ts.map