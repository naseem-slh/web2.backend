import mongoose, { model, Schema, Types } from "mongoose"

export interface IShopList {
    creator: Types.ObjectId
    store: string
    public?: boolean
    createdAt?: Date
    done?: boolean
}

const shopListSchema = new Schema<IShopList>({
    creator: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true 
    },
    store: { type: String, required: true },
    public: { type: Boolean, default: false },
    done: { type: Boolean, default: false }
},
{ timestamps: true });

export const ShopList = model<IShopList>("ShopList", shopListSchema);