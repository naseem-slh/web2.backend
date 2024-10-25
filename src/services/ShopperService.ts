import { Types } from "mongoose";
import { ShopListResource, ShopperResource } from "../Resources";
import { ShopList } from "../model/ShopListModel";
import { IUser, User } from "../model/UserModel";
import { dateToString } from "./ServiceHelper";
import { ShopItem } from "../model/ShopItemModel";

/**
 * Gibt alle ShopLists zurück, die für einen User sichtbar sind. Dies sind:
 * - alle öffentlichen (public) ShopLists
 * - alle eigenen ShopLists, dies ist natürlich nur möglich, wenn die userId angegeben ist.
 */
export async function getShopper(userId?: string): Promise<ShopperResource> {
    const shopLists: ShopListResource[] = []
    const map = new Map<string, ShopListResource>()
    const lists = await ShopList.find({
      $or: [{ creator: new Types.ObjectId(userId) }, { public: true }]
    })
    .populate<{ creator: IUser & { id: string } }>("creator")

    for (const list of lists) {
        if (!map.has(list.id)) { 
          const items = await ShopItem.countDocuments({ shopList: new Types.ObjectId(list.id) }).exec()
          const userOfList = await User.findById(list.creator.id).exec()
          const shopListResource: ShopListResource = {
              id: list.id,
              store: list.store,
              public: list.public,
              done: list.done,
              creator: list.creator.id,
              creatorName: userOfList?.name,
              createdAt: dateToString(list.createdAt!),
              shopItemCount: items
          }
          map.set(list.id, shopListResource)
        }
    }

    for (const value of map.values()) {
      shopLists.push(value)
    }
    return { shopLists }
}
