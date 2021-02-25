import { Characteristic, CharacteristicValue, Logger, PlatformAccessory, Service, WithUUID } from 'homebridge';
import { WiserClient } from '@string-bean/drayton-wiser-client';
import { HAP } from 'homebridge/lib/api';
import { CharacteristicProps } from 'hap-nodejs/dist/lib/Characteristic';
export declare type CharacteristicType = WithUUID<{
    new (): Characteristic;
}>;
export declare type ServiceType = WithUUID<typeof Service>;
export declare abstract class BaseAccessory {
    protected readonly accessory: PlatformAccessory;
    protected readonly hap: HAP;
    protected readonly log: Logger;
    protected readonly client: WiserClient;
    protected constructor(accessory: PlatformAccessory, hap: HAP, log: Logger, client: WiserClient);
    protected getService(serviceType: ServiceType): Service;
    protected registerCharacteristic({ serviceType, characteristicType, getter, setter, props, }: {
        serviceType: ServiceType;
        characteristicType: CharacteristicType;
        getter?: () => CharacteristicValue | undefined;
        setter?: (value: CharacteristicValue) => Promise<void>;
        props?: Partial<CharacteristicProps>;
    }): void;
    protected updateCharacteristic({ serviceType, characteristicType, value, }: {
        serviceType: ServiceType;
        characteristicType: CharacteristicType;
        value: CharacteristicValue;
    }): void;
}
//# sourceMappingURL=BaseAccessory.d.ts.map