/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module) => {

module.exports = require("tslib");

/***/ }),
/* 2 */
/***/ ((module) => {

module.exports = require("@nestjs/common");

/***/ }),
/* 3 */
/***/ ((module) => {

module.exports = require("@nestjs/core");

/***/ }),
/* 4 */
/***/ ((module) => {

module.exports = require("@nestjs/swagger");

/***/ }),
/* 5 */
/***/ ((module) => {

module.exports = require("fs");

/***/ }),
/* 6 */
/***/ ((module) => {

module.exports = require("path");

/***/ }),
/* 7 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AppModule = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(2);
const cache_manager_1 = __webpack_require__(8);
const core_1 = __webpack_require__(3);
const cache_manager_ioredis_yet_1 = __webpack_require__(9);
const config_module_1 = __webpack_require__(10);
const config_service_1 = __webpack_require__(11);
const mongoose_1 = __webpack_require__(15);
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [
            config_module_1.ConfigModule,
            cache_manager_1.CacheModule.registerAsync({
                imports: [config_module_1.ConfigModule],
                inject: [config_service_1.ConfigService],
                useFactory: (configService) => {
                    return {
                        store: cache_manager_ioredis_yet_1.redisStore,
                        host: configService.get('redis.host'),
                        port: configService.get('redis.port'),
                        password: configService.get('redis.pwd'),
                    };
                },
            }),
            mongoose_1.MongooseModule.forRootAsync({
                imports: [config_module_1.ConfigModule],
                inject: [config_service_1.ConfigService],
                useFactory: (configService) => {
                    return {
                        uri: configService.get('mongo.uri'),
                    };
                },
            }),
        ],
        controllers: [],
        providers: [
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: cache_manager_1.CacheInterceptor,
            },
        ],
    })
], AppModule);


/***/ }),
/* 8 */
/***/ ((module) => {

module.exports = require("@nestjs/cache-manager");

/***/ }),
/* 9 */
/***/ ((module) => {

module.exports = require("cache-manager-ioredis-yet");

/***/ }),
/* 10 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ConfigModule = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(2);
const config_service_1 = __webpack_require__(11);
let ConfigModule = class ConfigModule {
};
exports.ConfigModule = ConfigModule;
exports.ConfigModule = ConfigModule = tslib_1.__decorate([
    (0, common_1.Module)({
        providers: [
            {
                provide: config_service_1.ConfigService,
                useValue: new config_service_1.ConfigService(),
            },
        ],
        exports: [config_service_1.ConfigService],
    })
], ConfigModule);


/***/ }),
/* 11 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ConfigService = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(2);
const Joi = tslib_1.__importStar(__webpack_require__(12));
const lodash_1 = __webpack_require__(13);
const profiles_1 = __webpack_require__(14);
const DOTENV_SCHEMA = Joi.object({
    nodeEnv: Joi.string()
        .valid('development', 'production')
        .default('development'),
    server: Joi.object({
        port: Joi.number().default(3100),
    }).default({
        port: 3100,
    }),
    redis: Joi.object({
        pwd: Joi.string().required(),
        port: Joi.number().default(6379),
        host: Joi.string().default('localhost'),
    }),
    mongo: Joi.object({
        uri: Joi.string().required(),
    }),
});
class ConfigService {
    constructor() {
        this.logger = new common_1.Logger(ConfigService.name);
        this.envConfig = this.validateInput(profiles_1.Profiles[process.env.NODE_ENV || 'development']);
    }
    get(path) {
        return (0, lodash_1.get)(this.envConfig, path);
    }
    validateInput(envConfig) {
        const { error, value: validatedEnvConfig } = DOTENV_SCHEMA.validate(envConfig, {
            allowUnknown: true,
            stripUnknown: true,
        });
        if (error) {
            this.logger.error('Missing configuration please provide followed variable!\n\n', 'ConfigService');
            this.logger.error(error.message, 'ConfigService');
            process.exit(2);
        }
        return validatedEnvConfig;
    }
}
exports.ConfigService = ConfigService;


/***/ }),
/* 12 */
/***/ ((module) => {

module.exports = require("joi");

/***/ }),
/* 13 */
/***/ ((module) => {

module.exports = require("lodash");

/***/ }),
/* 14 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Profiles = void 0;
exports.Profiles = {
    development: {
        nodeEnv: process.env.NODE_ENV,
        mongo: {
            uri: process.env.MONGO_URI,
        },
        redis: {
            pwd: process.env.REDIS_PWD,
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT,
        },
        server: {
            port: process.env.PORT,
        },
    },
    production: {
        nodeEnv: process.env.NODE_ENV,
        mongo: {
            uri: process.env.MONGO_URI,
        },
        redis: {
            pwd: process.env.REDIS_PWD,
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT,
        },
        server: {
            port: process.env.PORT,
        },
    },
};


/***/ }),
/* 15 */
/***/ ((module) => {

module.exports = require("@nestjs/mongoose");

/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it uses a non-standard name for the exports (exports).
(() => {
var exports = __webpack_exports__;

/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(2);
const core_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(4);
const fs_1 = __webpack_require__(5);
const path_1 = tslib_1.__importDefault(__webpack_require__(6));
const app_module_1 = __webpack_require__(7);
const config_service_1 = __webpack_require__(11);
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const port = app.get(config_service_1.ConfigService).get('server.port');
    const globalPrefix = 'chat-api';
    app.setGlobalPrefix(globalPrefix);
    const packageJsonPath = path_1.default.join(__dirname, '../..', 'package.json');
    const packageJsonString = (0, fs_1.readFileSync)(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonString);
    const options = new swagger_1.DocumentBuilder()
        .setTitle('Chat API')
        .setVersion(packageJson.version)
        .addBearerAuth({
        type: 'http',
    }, 'Authorization')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, options);
    swagger_1.SwaggerModule.setup('chat/v1/docs', app, document);
    await app.listen(port);
    common_1.Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
}
bootstrap();

})();

/******/ })()
;