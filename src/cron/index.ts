import { Prisma, TxStatus } from '@prisma/client';
import axios from 'axios'
import { ethers } from 'ethers';
import { prisma } from '../prisma';
import { config } from 'dotenv';
import { id } from 'ethers/lib/utils';
config()

const BASE_URL: { [key: number]: string } = {
	1: 'https://api.etherscan.io/api'
}

const whitelist_addresses = [
	'0x2a5c2568b10a0e826bfa892cf21ba7218310180b'
]

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

const update_db_tx = async (
	id: number,
	data: Prisma.TransactionUpdateInput
) => {
	console.log(id, "id")
	const db_tx = await prisma.transaction.update({
		where: {
			id: id
		},
		data: data
	})

	if (!db_tx) throw "Can't update database"

	return true
}

const get_internal_tx = async (
	bridge: string,
	chain: number,
	startBlock: number,
	endBlock: number
) => {
	const base_url = BASE_URL[chain]

	const res = await axios({
		url: `${base_url}`,
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
			apiKey: process.env.ETHERSCAN_API
		}
	})

	const data = await res.data
	const tx_list = data.result

	for (let i = 0; i < tx_list.length; i++) {
		const tx = tx_list[i]

		const db_tx = await find_tx_by_to(tx.to)
		if (!db_tx) throw "Can't find tx"

		const plus10Percent = Number(db_tx.estimateAmount) + (0.1 * Number(db_tx.estimateAmount))
		const minus10Percent = Number(db_tx.estimateAmount) - (0.1 * Number(db_tx.estimateAmount))
		// console.log(tx.hash, plus10Percent, minus10Percent, value, "vavavava")

		if (plus10Percent == Infinity || minus10Percent == Infinity || isNaN(plus10Percent) || isNaN(minus10Percent)) throw "not a number"

		const value = Number(ethers.utils.formatUnits(tx.value, tx.tokenDecimal))

		console.log(db_tx.estimateAmount, plus10Percent, minus10Percent, tx.value, value)

		if (Number(db_tx.estimateAmount) === value || Number(plus10Percent) >= value || Number(minus10Percent) <= value) {
			console.log("found -> ", tx.hash)
			await update_db_tx(db_tx.id, {
				dest_tx_hash: tx.hash,
				status: TxStatus.COMPLETED
			})
		}
	}
}

const get_erc20_tx = async (
	bridge: string,
	chain: number,
	startBlock: number,
	endBlock: number
) => {
	const base_url = BASE_URL[chain]

	const res = await axios({
		url: `${base_url}`,
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
			apiKey: process.env.ETHERSCAN_API
		}
	})

	const data = await res.data
	const tx_list = data.result

	for (let i = 0; i < tx_list.length; i++) {
		const tx = tx_list[i]

		const db_tx = await find_tx_by_to(tx.to)
		if (!db_tx) throw "Can't find tx"

		const plus10Percent = Number(db_tx.estimateAmount) + (0.1 * Number(db_tx.estimateAmount))
		const minus10Percent = Number(db_tx.estimateAmount) - (0.1 * Number(db_tx.estimateAmount))

		if (plus10Percent == Infinity || minus10Percent == Infinity || isNaN(plus10Percent) || isNaN(minus10Percent)) throw "not a number"

		const value = Number(ethers.utils.formatUnits(tx.value, tx.tokenDecimal))

		console.log(db_tx.estimateAmount, plus10Percent, minus10Percent, tx.value, value)

		if (Number(db_tx.estimateAmount) === value || Number(plus10Percent) >= value || Number(minus10Percent) <= value) {
			console.log("found -> ", tx.hash)
			await update_db_tx(db_tx.id, {
				dest_tx_hash: tx.hash,
				status: TxStatus.COMPLETED
			})
		}
	}
}

const cron_job = async () => {
	const block = await prisma.block.findFirst()
	if (!block) throw "Can't find block"
	const block_no = Number(block.block_number)

	const provider = new ethers.providers.JsonRpcProvider(process.env.ETH_RPC_URL)
	const curr_block = await provider.getBlockNumber()
	if (curr_block > block_no) {
		console.log('1')
		whitelist_addresses.map(address => {
			get_internal_tx(
				address,
				1,
				block_no,
				curr_block
			).then(a => console.log(a, "internal tx")).catch(e => console.log(e, "internal tx error"))
			get_erc20_tx(
				address,
				1,
				block_no,
				curr_block
			).then(a => console.log(a, "erc20 tx")).catch(e => console.log(e, "erc20 tx error"))
		})
	} else {
		whitelist_addresses.map(address => {
			console.log('2')
			get_internal_tx(
				address,
				1,
				block_no,
				block_no
			).then(a => console.log(a, "internal tx")).catch(e => console.log(e, "internal tx error"))
			get_erc20_tx(
				address,
				1,
				block_no,
				block_no
			).then(a => console.log(a, "erc20 tx")).catch(e => console.log(e, "erc20 tx error"))
		})
	}
}

cron_job().then(a => console.log(a)).catch(e => console.log(e))