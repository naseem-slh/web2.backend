export type UsersResource = {
    users: UserResource[]
}

export type UserResource = {
    id?: string
    name: string
    email: string
    admin: boolean
    password?: string
}

export type ShopperResource = {
    shopLists: ShopListResource[]
}

export type ShopListResource = {
    id?: string
    store: string
    public?: boolean
    done?: boolean
    creator: string
    creatorName?: string
    createdAt?: string
    shopItemCount?: number
}

export type ShopItemResource = {
    id?: string
    name: string
    quantity: string
    remarks?: string
    creator: string
    creatorName?: string
    createdAt?: string
    shopList: string
    shopListStore?: string
}

export type ShopListItemsResource = {
    shopItems: ShopItemResource[]
}

export type LoginResource = {
    /** The JWT */
    "access_token": string,
    /** Constant value */
    "token_type": "Bearer"
}