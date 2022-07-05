import { gql } from "apollo-server"
import { Kind, GraphQLScalarType } from "graphql"

export const resolverMap = {
	Date: new GraphQLScalarType({
		name: 'Date',
		description: 'Date Time for GraphQL',
		parseValue: (value: any) => {
			return new Date(value)
		},
		serialize: (value: any) => {
			return value.getTime()
		},
		parseLiteral: (ast: any) => {
			if(ast.kind == Kind.INT) {
				return new Date(+ast.value)
			}
			return null
		}
	})
}

export const typeDefs = gql`
	scalar Date

	type Transaction {
		id: ID!
		from: String!
		to: String!
		from_chain: String!
		to_chain: String!
		origin_tx_hash: String!
		dest_tx_hash: String
		bridge: Bridge!
		status: TxStatus!
		origin_time: Date!
		dest_time: Date
	}

	input CreateTransaction {
		from: String!
		to: String!
		from_chain: Chain!
		to_chain: Chain!
		origin_tx_hash: String!
		bridge: Bridge!
		status: TxStatus!
		origin_time: Date!
	}

	input UpdateTransaction {
		id: ID!
		from: String
		to: String
		from_chain: Chain!
		to_chain: Chain!
		origin_tx_hash: String
		dest_tx_hash: String
		bridge: Bridge
		status: TxStatus
		origin_time: Date
		dest_time: Date
	}

	type Query {
		transaction(id: ID!): Transaction
		transactions: [Transaction!]
		userTransactions(from: String!): [Transaction!]
	}

	type Mutation {
		createTransaction(tx: CreateTransaction!): Transaction!
		updateTransaction(tx: UpdateTransaction!): Transaction!
	}

	enum Bridge {
		HOP
		HYPHEN
		CELER
		ACROSS
	}

	enum TxStatus {
		PENDING
		FAILED
		COMPLETED
	}

	enum Chain {
		POL
		ETH
		AVAX
		BSC
	}
`