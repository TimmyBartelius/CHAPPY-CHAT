export interface User{
    PK: string,
    SK: string,
    accessLevel: string,
    passwordHash: string,
    username: string
    id: string
}
export interface Channel{
    PK: string,
    SK: string,
    creatorId: string,
    isLocked: boolean,
    name: string
    id: string
}

export interface Guest{
    PK: string,
    SK: string,
    accessLevel: string,
    passwordHash: string,
    username: string
    id: string
}