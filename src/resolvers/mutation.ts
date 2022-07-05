import { prisma } from "../prisma";

export const Mutation = {
	createTransaction: (parent: any, args: any) => {
		console.log(parent, args)
		return prisma.transaction.create({
			data: {
				from: args.tx.from,
				to: args.tx.to,
				origin_tx_hash: args.tx.origin_tx_hash,
				from_chain: args.tx.from_chain,
				to_chain: args.tx.to_chain,
				bridge: args.tx.bridge,
				status: args.tx.status
			}
		})
	},
	updateTransaction: (parent: any, args: any) => {
		return prisma.transaction.update({
			where: {
				id: Number(args.tx.id)
			},
			data: {
				from: args.tx.from,
				to: args.tx.to,
				origin_tx_hash: args.tx.origin_tx_hash,
				bridge: args.tx.bridge,
				from_chain: args.tx.from_chain,
				to_chain: args.tx.to_chain,
				status: args.tx.status,
				dest_time: args.tx.dest_time,
				dest_tx_hash: args.tx.dest_tx_hash
			}
		})
	}
}