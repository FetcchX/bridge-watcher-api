import { ApolloServer } from "apollo-server"
import { typeDefs } from "./schema"
import { resolvers } from "./resolvers"

const port = process.env.PORT || 5001

const server = new ApolloServer({ resolvers, typeDefs })

server.listen({ port }, () => console.log(`Server running at -> http://localhost:${port}`))