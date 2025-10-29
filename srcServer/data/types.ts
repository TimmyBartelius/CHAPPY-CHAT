export interface Users{
    PK: string,
    SK: string,
    accessLevel: string,
    passwordHash: string,
    username: string
}
export interface Channels{
    PK: string,
    SK: string,
    creatorId: string,
    isLocked: boolean,
    name: string
}