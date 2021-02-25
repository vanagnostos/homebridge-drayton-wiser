"use strict";
const WiserPlatformPlugin_1 = require("./WiserPlatformPlugin");
module.exports = (homebridge) => {
    homebridge.registerPlatform('homebridge-drayton-wiser', 'drayton-wiser', WiserPlatformPlugin_1.WiserPlatformPlugin);
};
//# sourceMappingURL=index.js.map