"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var client_1 = require("@prisma/client");
var axios_1 = require("axios");
var ethers_1 = require("ethers");
var prisma_1 = require("../prisma");
var dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
var BASE_URL = {
    1: 'https://api.etherscan.io/api'
};
var whitelist_addresses = [
    '0x2a5c2568b10a0e826bfa892cf21ba7218310180b'
];
var find_tx_by_to = function (to) {
    return prisma_1.prisma.transaction.findFirst({
        where: {
            to: to,
            status: client_1.TxStatus.PENDING
        },
        orderBy: {
            origin_time: "desc"
        }
    });
};
var update_db_tx = function (id, data) { return __awaiter(void 0, void 0, void 0, function () {
    var db_tx;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log(id, "id");
                return [4 /*yield*/, prisma_1.prisma.transaction.update({
                        where: {
                            id: id
                        },
                        data: data
                    })];
            case 1:
                db_tx = _a.sent();
                if (!db_tx)
                    throw "Can't update database";
                return [2 /*return*/, true];
        }
    });
}); };
var get_internal_tx = function (bridge, chain, startBlock, endBlock) { return __awaiter(void 0, void 0, void 0, function () {
    var base_url, res, data, tx_list, i, tx, db_tx, plus10Percent, minus10Percent, value;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                base_url = BASE_URL[chain];
                return [4 /*yield*/, (0, axios_1["default"])({
                        url: "".concat(base_url),
                        method: 'GET',
                        params: {
                            module: 'account',
                            action: 'txlistinternal',
                            address: bridge,
                            startblock: startBlock,
                            endblock: endBlock,
                            page: 1,
                            offset: 10,
                            sort: 'asc',
                            apiKey: 'K1A72SQ6H1ZTJRKRD2D8VB6I6HYGHPJKMY'
                        }
                    })];
            case 1:
                res = _a.sent();
                return [4 /*yield*/, res.data];
            case 2:
                data = _a.sent();
                tx_list = data.result;
                i = 0;
                _a.label = 3;
            case 3:
                if (!(i < tx_list.length)) return [3 /*break*/, 7];
                tx = tx_list[i];
                return [4 /*yield*/, find_tx_by_to(tx.to)];
            case 4:
                db_tx = _a.sent();
                if (!db_tx)
                    throw "Can't find tx";
                plus10Percent = Number(db_tx.estimateAmount) + (0.1 * Number(db_tx.estimateAmount));
                minus10Percent = Number(db_tx.estimateAmount) - (0.1 * Number(db_tx.estimateAmount));
                // console.log(tx.hash, plus10Percent, minus10Percent, value, "vavavava")
                if (plus10Percent == Infinity || minus10Percent == Infinity || isNaN(plus10Percent) || isNaN(minus10Percent))
                    throw "not a number";
                value = Number(ethers_1.ethers.utils.formatUnits(tx.value, tx.tokenDecimal));
                console.log(db_tx.estimateAmount, plus10Percent, minus10Percent, tx.value, value);
                if (!(Number(db_tx.estimateAmount) === value || Number(plus10Percent) >= value || Number(minus10Percent) <= value)) return [3 /*break*/, 6];
                console.log("found -> ", tx.hash);
                return [4 /*yield*/, update_db_tx(db_tx.id, {
                        dest_tx_hash: tx.hash,
                        status: client_1.TxStatus.COMPLETED
                    })];
            case 5:
                _a.sent();
                _a.label = 6;
            case 6:
                i++;
                return [3 /*break*/, 3];
            case 7: return [2 /*return*/];
        }
    });
}); };
var get_erc20_tx = function (bridge, chain, startBlock, endBlock) { return __awaiter(void 0, void 0, void 0, function () {
    var base_url, res, data, tx_list, i, tx, db_tx, plus10Percent, minus10Percent, value;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                base_url = BASE_URL[chain];
                return [4 /*yield*/, (0, axios_1["default"])({
                        url: "".concat(base_url),
                        method: 'GET',
                        params: {
                            module: 'account',
                            action: 'tokentx',
                            address: bridge,
                            startblock: startBlock,
                            endblock: endBlock,
                            page: 1,
                            offset: 10,
                            sort: 'asc',
                            apiKey: 'K1A72SQ6H1ZTJRKRD2D8VB6I6HYGHPJKMY'
                        }
                    })];
            case 1:
                res = _a.sent();
                return [4 /*yield*/, res.data];
            case 2:
                data = _a.sent();
                tx_list = data.result;
                i = 0;
                _a.label = 3;
            case 3:
                if (!(i < tx_list.length)) return [3 /*break*/, 7];
                tx = tx_list[i];
                return [4 /*yield*/, find_tx_by_to(tx.to)];
            case 4:
                db_tx = _a.sent();
                if (!db_tx)
                    throw "Can't find tx";
                plus10Percent = Number(db_tx.estimateAmount) + (0.1 * Number(db_tx.estimateAmount));
                minus10Percent = Number(db_tx.estimateAmount) - (0.1 * Number(db_tx.estimateAmount));
                if (plus10Percent == Infinity || minus10Percent == Infinity || isNaN(plus10Percent) || isNaN(minus10Percent))
                    throw "not a number";
                value = Number(ethers_1.ethers.utils.formatUnits(tx.value, tx.tokenDecimal));
                console.log(db_tx.estimateAmount, plus10Percent, minus10Percent, tx.value, value);
                if (!(Number(db_tx.estimateAmount) === value || Number(plus10Percent) >= value || Number(minus10Percent) <= value)) return [3 /*break*/, 6];
                console.log("found -> ", tx.hash);
                return [4 /*yield*/, update_db_tx(db_tx.id, {
                        dest_tx_hash: tx.hash,
                        status: client_1.TxStatus.COMPLETED
                    })];
            case 5:
                _a.sent();
                _a.label = 6;
            case 6:
                i++;
                return [3 /*break*/, 3];
            case 7: return [2 /*return*/];
        }
    });
}); };
var cron_job = function () { return __awaiter(void 0, void 0, void 0, function () {
    var block, block_no, provider, curr_block;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma_1.prisma.block.findFirst()];
            case 1:
                block = _a.sent();
                if (!block)
                    throw "Can't find block";
                block_no = Number(block.block_number);
                provider = new ethers_1.ethers.providers.JsonRpcProvider(process.env.ETH_RPC_URL);
                return [4 /*yield*/, provider.getBlockNumber()];
            case 2:
                curr_block = _a.sent();
                if (curr_block > block_no) {
                    console.log('1');
                    whitelist_addresses.map(function (address) {
                        get_internal_tx(address, 1, block_no, curr_block).then(function (a) { return console.log(a, "internal tx"); })["catch"](function (e) { return console.log(e, "internal tx error"); });
                        get_erc20_tx(address, 1, block_no, curr_block).then(function (a) { return console.log(a, "erc20 tx"); })["catch"](function (e) { return console.log(e, "erc20 tx error"); });
                    });
                }
                else {
                    whitelist_addresses.map(function (address) {
                        console.log('2');
                        get_internal_tx(address, 1, block_no, block_no).then(function (a) { return console.log(a, "internal tx"); })["catch"](function (e) { return console.log(e, "internal tx error"); });
                        get_erc20_tx(address, 1, block_no, block_no).then(function (a) { return console.log(a, "erc20 tx"); })["catch"](function (e) { return console.log(e, "erc20 tx error"); });
                    });
                }
                return [2 /*return*/];
        }
    });
}); };
cron_job().then(function (a) { return console.log(a); })["catch"](function (e) { return console.log(e); });
