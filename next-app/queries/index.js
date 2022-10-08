// GraphQL queries
export function FETCH_CREATED_GAMES() {
    return `query {
        games (orderBy: id, orderDirection: Desc, first: 1) {
            id
            maxPlayers
            entryFee
            winner
            players
        }
    }`
}