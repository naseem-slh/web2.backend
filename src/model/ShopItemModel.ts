import mongoose, { model, Schema, Types } from "mongoose"

export interface IShopItem {
    creator: Types.ObjectId
    shopList: Types.ObjectId
    name: string
    quantity: string
    remarks?: string
    createdAt?: Date
}

const shopItemSchema = new Schema<IShopItem>({
    creator: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true 
    },
    shopList: {
        type: Schema.Types.ObjectId,
        ref: "ShopList",
        required: true 
    },
    name: { type: String, required: true },
    quantity: { type: String, required: true },
    remarks: { type: String}
},
{ timestamps: true }
)

export const ShopItem = model<IShopItem>("ShopItem", shopItemSchema);
