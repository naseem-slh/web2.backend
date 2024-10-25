import { Types } from "mongoose";
import { ShopItemResource, ShopListItemsResource } from "../Resources";
import { ShopItem } from "../model/ShopItemModel";
import { ShopList } from "../model/ShopListModel";
import { IUser, User } from "../model/UserModel";
import { dateToString } from "./ServiceHelper";

/**
 * Gibt alle ShopItems zurück in einer ShopList zurück.
 */
export async function getShopListItems(shopListId: string): Promise<ShopListItemsResource> {
    const liste = await ShopList.findById(shopListId)
    if (liste) {
        const items = await ShopItem.find({ shopList: new Types.ObjectId(shopListId) }).populate<{ creator: IUser & { id: string } }>("creator")
        const shopItems: ShopItemResource[] = [];
        const user = await User.findById(liste.creator.id).exec()
        for (const item of items) {
            
            shopItems.push({
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                remarks: item.remarks,
                creator: item.creator.id,
                creatorName: user?.name,
                createdAt: dateToString(item.createdAt!),
                shopList: liste.id,
                shopListStore: liste.store,
            })
        }
        return { shopItems }
    }
    else {
        throw new Error(`No ShopList with id ${shopListId} found`)
    }
}
