import { Types } from "mongoose";
import { ShopListResource } from "../Resources";
import { ShopItem } from "../model/ShopItemModel";
import { ShopList } from "../model/ShopListModel";
import { IUser, User } from "../model/UserModel";
import { dateToString } from "./ServiceHelper";

/**
 * Liefer die ShopList mit angegebener ID.
 * Falls keine ShopList gefunden wurde, wird ein Fehler geworfen.
 */
export async function getShopList(id: string): Promise<ShopListResource> {
    const liste = await ShopList.findById(id).populate<{ creator: IUser & { id: string } }>("creator")
    if (liste) {
        const user = await User.findById(liste.creator.id).exec()
        if (!user)
            throw new Error(`No Creator with id ${liste.creator.id} found`)
        //shopitem count
        const items = await ShopItem.countDocuments({ shopList: new Types.ObjectId(id) }).exec()
        //ShopListResource return
        return {
            id: liste.id,
            store: liste.store,
            public: liste.public,
            done: liste.done,
            creator: liste.creator.id,
            creatorName: user?.name,
            createdAt: dateToString(liste.createdAt!),
            shopItemCount: items
        }
    }
    else
        throw new Error(`No ShopList with id ${id} found, cannot update`)
}


/**
 * Erzeugt die ShopList.
 */
export async function createShopList(shopListResource: ShopListResource): Promise<ShopListResource> {
    const user = await User.findById(shopListResource.creator).exec()
    if (!user)
        throw new Error(`No Creator with id ${shopListResource.creator} found`)
    const list = await ShopList.create({
        creator: shopListResource.creator,
        store: shopListResource.store,
        public: shopListResource.public,
        done: shopListResource.done
    })
    const res = await list.populate<{ creator: IUser & { id: string } }>("creator")
    const items = await ShopItem.countDocuments({ shopList: new Types.ObjectId(res.id) }).exec()
    return {
        id: res.id,
        store: res.store,
        public: res.public,
        done: res.done,
        creator: res.creator.id,
        creatorName: res.creator.name,
        createdAt: dateToString(res.createdAt!),
        shopItemCount: items
    }
}

/**
 * Ändert die Daten einer ShopList.
 * Aktuell können nur folgende Daten geändert werden: store, public, done.
 * Falls andere Daten geändert werden, wird dies ignoriert.
 */
export async function updateShopList(shopListResource: ShopListResource): Promise<ShopListResource> {
    if (!shopListResource.id) {
        throw new Error(`No id: ${shopListResource.id} found, cannot update`);
    }
    const list = await ShopList.findById(shopListResource.id).exec();
    if (!list) {
        throw new Error(`No ShopList with id ${shopListResource.id} found, cannot update`);
    }
    if (shopListResource.store) list.store = shopListResource.store;
    if (shopListResource.public) list.public = shopListResource.public;
    if (shopListResource.done) list.done = shopListResource.done;

    const savedList = await list.save();
    const res = await savedList.populate<{ creator: IUser & { id: string } }>("creator")

    const items = await ShopItem.countDocuments({ shopList: new Types.ObjectId(res.id) }).exec()
    return {
        id: res.id,
        store: res.store,
        public: res.public,
        done: res.done,
        creator: res.creator.id,
        creatorName: res.creator.name,
        createdAt: dateToString(res.createdAt!),
        shopItemCount: items
    }
}

/**
 * Beim Löschen wird die ShopList über die ID identifiziert.
 * Falls keine ShopList nicht gefunden wurde (oder aus
 * anderen Gründen nicht gelöscht werden kann) wird ein Fehler geworfen.
 * Wenn die ShopList gelöscht wird, müssen auch alle zugehörigen ShopItems gelöscht werden.
 */

export async function deleteShopList(id: string): Promise<void> {
    const res = await ShopList.deleteOne({ _id: new Types.ObjectId(id) }).exec()
    if (res.deletedCount !== 1) {
        throw new Error(`No ShopList with id ${id} deleted, probably id not valid`);
    }
    //delete dependent shopItems
    await ShopItem.deleteMany({ shopList: id }).exec()
}
