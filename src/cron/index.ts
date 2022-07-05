import { TxStatus } from "@prisma/client";
import { prisma } from "../prisma";
import { ethers } from "ethers";
import { config } from "dotenv";
config();

/*
1. Check Transactions of every Block
2. Check if `to` of that tx exists in database for any pending tx 
3. Decode Tx Data and compare depositHash
4. If it exists, compare the tokens, compare the value
*/

const provider = new ethers.providers.JsonRpcProvider(process.env.POL_RPC_URL);

const find_tx_by_to = (to: string) => {
	return prisma.transaction.findFirst({
		where: {
			to: to,
		},
		orderBy: {
			origin_time: "desc",
		},
	});
};

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
		const db_tx = await find_tx_by_to(tx.to as string);
		console.log(tx.hash, tx.value.toString(), "Hash and Value");

		if (!db_tx) return;

		// if(db_tx.)

		// if(!tx.data.indexOf('0xabcffc26')) {

		// }
	});
};

getLatestBlock(30094266);
