import { prisma } from "../prisma";

export const Query = {
	transaction: (parent: any, args: any) => {
		return prisma.transaction.findFirst({
			where: {
				id: Number(args.id)
			}
		})
	},

	transactions: (parent: any, args: any) => {
		return prisma.transaction.findMany()
	},

	userTransactions: (parent: any, args: any) => {
		return prisma.transaction.findMany({
			where: {
				from: args.from
			}
		})
	}
}