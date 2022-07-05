import { prisma } from "../prisma";
import { Query } from "./query";
import { Mutation } from "./mutation";

const Transaction = {
	id: (parent: any, args: any, context: any, info: any) => parent.id,
	from: (parent: any, args: any, context: any, info: any) => parent.from,
	to: (parent: any, args: any, context: any, info: any) => parent.to,
	from_chain: (parent: any, args: any, context: any, info: any) => parent.from_chain,
	to_chain: (parent: any, args: any, context: any, info: any) => parent.to_chain,
	origin_tx_hash: (parent: any, args: any, context: any, info: any) => parent.origin_tx_hash,
	dest_tx_hash: (parent: any, args: any, context: any, info: any) => parent.dest_tx_hash,
	bridge: (parent: any, args: any, context: any, info: any) => parent.bridge,
	status: (parent: any, args: any, context: any, info: any) => parent.status,
	origin_time: (parent: any, args: any, context: any, info: any) => {
		return new Date(parent.origin_time)
	},
	dest_time: (parent: any, args: any, context: any, info: any) => {
		return new Date(parent.dest_time)
	},
}

export const resolvers = {
	Transaction,
	Query,
	Mutation
}