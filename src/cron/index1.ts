import { TxStatus } from "@prisma/client";
import { prisma } from "../prisma";
import { BigNumber, ethers } from "ethers";
import { config } from "dotenv";
import { isNumber } from "util";
config();

/*
1. Check Transactions of every Block
2. Check if `to` of that tx exists in database for any pending tx 
3. Decode Tx Data and compare depositHash
4. If it exists, compare the tokens, compare the value
*/

const abi = [{ "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "spender", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "authorizer", "type": "address" }, { "indexed": true, "internalType": "bytes32", "name": "nonce", "type": "bytes32" }], "name": "AuthorizationCanceled", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "authorizer", "type": "address" }, { "indexed": true, "internalType": "bytes32", "name": "nonce", "type": "bytes32" }], "name": "AuthorizationUsed", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "_account", "type": "address" }], "name": "Blacklisted", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "newBlacklister", "type": "address" }], "name": "BlacklisterChanged", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "burner", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "Burn", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "newMasterMinter", "type": "address" }], "name": "MasterMinterChanged", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "minter", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "Mint", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "minter", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "minterAllowedAmount", "type": "uint256" }], "name": "MinterConfigured", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "oldMinter", "type": "address" }], "name": "MinterRemoved", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "address", "name": "previousOwner", "type": "address" }, { "indexed": false, "internalType": "address", "name": "newOwner", "type": "address" }], "name": "OwnershipTransferred", "type": "event" }, { "anonymous": false, "inputs": [], "name": "Pause", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "newAddress", "type": "address" }], "name": "PauserChanged", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "newRescuer", "type": "address" }], "name": "RescuerChanged", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "Transfer", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "_account", "type": "address" }], "name": "UnBlacklisted", "type": "event" }, { "anonymous": false, "inputs": [], "name": "Unpause", "type": "event" }, { "inputs": [], "name": "CANCEL_AUTHORIZATION_TYPEHASH", "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "DOMAIN_SEPARATOR", "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "PERMIT_TYPEHASH", "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "RECEIVE_WITH_AUTHORIZATION_TYPEHASH", "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "TRANSFER_WITH_AUTHORIZATION_TYPEHASH", "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" }], "name": "allowance", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "approve", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "authorizer", "type": "address" }, { "internalType": "bytes32", "name": "nonce", "type": "bytes32" }], "name": "authorizationState", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_account", "type": "address" }], "name": "blacklist", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "blacklister", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_amount", "type": "uint256" }], "name": "burn", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "authorizer", "type": "address" }, { "internalType": "bytes32", "name": "nonce", "type": "bytes32" }, { "internalType": "uint8", "name": "v", "type": "uint8" }, { "internalType": "bytes32", "name": "r", "type": "bytes32" }, { "internalType": "bytes32", "name": "s", "type": "bytes32" }], "name": "cancelAuthorization", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "minter", "type": "address" }, { "internalType": "uint256", "name": "minterAllowedAmount", "type": "uint256" }], "name": "configureMinter", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "currency", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "decrement", "type": "uint256" }], "name": "decreaseAllowance", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "increment", "type": "uint256" }], "name": "increaseAllowance", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "string", "name": "tokenName", "type": "string" }, { "internalType": "string", "name": "tokenSymbol", "type": "string" }, { "internalType": "string", "name": "tokenCurrency", "type": "string" }, { "internalType": "uint8", "name": "tokenDecimals", "type": "uint8" }, { "internalType": "address", "name": "newMasterMinter", "type": "address" }, { "internalType": "address", "name": "newPauser", "type": "address" }, { "internalType": "address", "name": "newBlacklister", "type": "address" }, { "internalType": "address", "name": "newOwner", "type": "address" }], "name": "initialize", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "string", "name": "newName", "type": "string" }], "name": "initializeV2", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "lostAndFound", "type": "address" }], "name": "initializeV2_1", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_account", "type": "address" }], "name": "isBlacklisted", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "isMinter", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "masterMinter", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_to", "type": "address" }, { "internalType": "uint256", "name": "_amount", "type": "uint256" }], "name": "mint", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "minter", "type": "address" }], "name": "minterAllowance", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "name", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }], "name": "nonces", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "owner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "pause", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "paused", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "pauser", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }, { "internalType": "uint8", "name": "v", "type": "uint8" }, { "internalType": "bytes32", "name": "r", "type": "bytes32" }, { "internalType": "bytes32", "name": "s", "type": "bytes32" }], "name": "permit", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" }, { "internalType": "uint256", "name": "validAfter", "type": "uint256" }, { "internalType": "uint256", "name": "validBefore", "type": "uint256" }, { "internalType": "bytes32", "name": "nonce", "type": "bytes32" }, { "internalType": "uint8", "name": "v", "type": "uint8" }, { "internalType": "bytes32", "name": "r", "type": "bytes32" }, { "internalType": "bytes32", "name": "s", "type": "bytes32" }], "name": "receiveWithAuthorization", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "minter", "type": "address" }], "name": "removeMinter", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "contract IERC20", "name": "tokenContract", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "rescueERC20", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "rescuer", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "symbol", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "totalSupply", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "transfer", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "transferFrom", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "newOwner", "type": "address" }], "name": "transferOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" }, { "internalType": "uint256", "name": "validAfter", "type": "uint256" }, { "internalType": "uint256", "name": "validBefore", "type": "uint256" }, { "internalType": "bytes32", "name": "nonce", "type": "bytes32" }, { "internalType": "uint8", "name": "v", "type": "uint8" }, { "internalType": "bytes32", "name": "r", "type": "bytes32" }, { "internalType": "bytes32", "name": "s", "type": "bytes32" }], "name": "transferWithAuthorization", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_account", "type": "address" }], "name": "unBlacklist", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "unpause", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_newBlacklister", "type": "address" }], "name": "updateBlacklister", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_newMasterMinter", "type": "address" }], "name": "updateMasterMinter", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_newPauser", "type": "address" }], "name": "updatePauser", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "newRescuer", "type": "address" }], "name": "updateRescuer", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "version", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }]

const NATIVE_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'

const provider = new ethers.providers.JsonRpcProvider(process.env.ETH_RPC_URL);

const find_tx_by_to = (to: string) => {
	return prisma.transaction.findFirst({
		where: {
			to: to,
			status: TxStatus.PENDING
		},
		orderBy: {
			origin_time: "desc",
		},
	});
};


// @note add to estimate amount, it will be easy for checking (converted)

const decodeTx = async (tx: ethers.providers.TransactionResponse) => {
	const txReceipt = await provider.getTransactionReceipt(tx.hash)

	const db_tx = await find_tx_by_to('0xe7804c37c13166ff0b37f5ae0bb07a3aebb6e245' as string);

	if (!db_tx || '0x2A5c2568b10A0E826BfA892Cf21BA7218310180b' !== tx.to) throw "Transaction not found in database";
	console.log(db_tx.to_token === NATIVE_ADDRESS, "dsa")

	if (db_tx.to_token === NATIVE_ADDRESS) {
		const value = tx.value.toString()
		const plus10Percent = Number(value) + ((1 / Number(value)) * 100)
		const minus10Percent = Number(value) - ((1 / Number(value)) * 100)
		console.log(tx.hash, plus10Percent, minus10Percent, value, "vavavava")

		if (plus10Percent == Infinity || minus10Percent == Infinity || isNaN(plus10Percent) || isNaN(minus10Percent)) throw "not a number"


		if (Number(ethers.utils.formatEther(plus10Percent.toFixed(0)).toString()) <= Number(db_tx.estimateAmount) && Number(ethers.utils.formatEther(minus10Percent.toFixed(0)).toString()) >= Number(db_tx.estimateAmount)) {
			console.log("Found -> ", tx.hash, Number(db_tx.estimateAmount), Number(ethers.utils.formatEther(minus10Percent.toString()).toString()), Number(ethers.utils.formatEther(plus10Percent.toString()).toString()))
		}
	} else {
		const logs = txReceipt.logs

		logs.map(log => {
			if (log.address === db_tx.to_token) {
				if (log.topics.length === 3) {
					const value = BigNumber.from(log.data).toNumber()

					const plus10Percent = Number(value) + ((1 / Number(value)) * 100)
					const minus10Percent = Number(value) - ((1 / Number(value)) * 100)
					if (Number(ethers.utils.formatEther(plus10Percent).toString()) <= Number(db_tx.estimateAmount) && Number(ethers.utils.formatEther(minus10Percent).toString()) >= Number(db_tx.estimateAmount)) {
						console.log("Found -> ", tx.hash, Number(db_tx.amount), Number(ethers.utils.formatEther(minus10Percent).toString()), Number(ethers.utils.formatEther(plus10Percent).toString()))
					}
				}
			}
		})
	}
}

const getLatestBlock = async (block_number?: number) => {
	if (!block_number) {
		const prev_block_number = await prisma.block.findFirst();
		if (prev_block_number?.block_number) {
			block_number = Number(prev_block_number.block_number) + 1;
		} else {
			block_number = 0;
		}
	}

	const newBlock = await provider.getBlockWithTransactions(block_number);
	const txs = newBlock.transactions;

	txs.map(async (tx) => {
		try {
			await decodeTx(tx)
		} catch (e) {
			// console.log(e, "Error")
		}
	});
};

getLatestBlock(14951116);
