

import Vue from 'vue';
import logger from 'vuejs-logger';

const options = {
    isEnabled: true,
    logLevel: 'debug',
    stringifyArguments: false,
    showLogLevel: true,
    showMethodName: false,
    separator: '|',
    showConsoleColors: true
};

Vue.use(logger as any, options as any);
declare module 'vue/types/vue' {
    // 3. Declare augmentation for Vue
    interface VueConstructor {
        $log: {
            debug(...args: any[]): void;
            info(...args: any[]): void;
            warn(...args: any[]): void;
            error(...args: any[]): void;
            fatal(...args: any[]): void;
        };
    }
}
