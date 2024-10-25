import { Types } from "mongoose";
import { ShopItemResource } from "../Resources";
import { ShopItem } from "../model/ShopItemModel";
import { IShopList, ShopList } from "../model/ShopListModel";
import { IUser, User } from "../model/UserModel";
import { dateToString } from "./ServiceHelper";

/**
 * Liefert die ShopItemResource mit angegebener ID.
 * Falls kein ShopItem gefunden wurde, wird ein Fehler geworfen.
 */
export async function getShopItem(id: string): Promise<ShopItemResource> {
    const shopItem = await ShopItem.findById(id)
        .populate<{ creator: IUser & { id: string }, shopList: IShopList & { id: string } }>([
            { path: "creator" },
            { path: "shopList" }
        ])
    if (shopItem) {
        const user = await User.findById(shopItem.creator.id).exec()
        if (!user)
            throw new Error(`No Creator with id ${shopItem.creator.id} found`)
        const list = await ShopList.findById(shopItem.shopList.id).exec()
        if (!list)
            throw new Error(`No Creator with id ${shopItem.shopList.id} found`)
        //shopItemResource return
        return {
            id: shopItem.id,
            name: shopItem.name,
            quantity: shopItem.quantity,
            remarks: shopItem.remarks,
            creator: shopItem.creator.id,
            creatorName: user?.name,
            createdAt: dateToString(shopItem.createdAt!),
            shopList: shopItem.shopList.id,
            shopListStore: list?.store
        }
    }
    else
        throw new Error(`No shopItem with id ${id} found, cannot update`)
}

/**
 * Erzeugt ein ShopItem.
 * Daten, die berechnet werden aber in der gegebenen Ressource gesetzt sind, werden ignoriert.
 * Falls die Liste geschlossen (done) ist, wird ein Fehler wird geworfen.
 */
export async function createShopItem(shopItemResource: ShopItemResource): Promise<ShopItemResource> {
    const userCheck = await User.findById(shopItemResource.creator).exec()
    if (!userCheck)
        throw new Error(`No Creator with id ${shopItemResource.creator} found`)
    const listCheck = await ShopList.findById(shopItemResource.shopList).exec()
    if (!listCheck)
        throw new Error(`No Creator with id ${shopItemResource.shopList} found`)
    const list = await ShopList.findById(shopItemResource.shopList)
    if (list?.done)
        throw new Error("List is already done")
    const item = await ShopItem.create({
        creator: shopItemResource.creator,
        shopList: shopItemResource.shopList,
        name: shopItemResource.name,
        quantity: shopItemResource.quantity,
        remarks: shopItemResource.remarks
    })
    const res = await item
        .populate<{ creator: IUser & { id: string }, shopList: IShopList & { id: string } }>([
            { path: "creator" },
            { path: "shopList" }
        ])
    const user = await User.findById(res.creator.id).exec()
    const listToReturn = await ShopList.findById(res.shopList.id).exec()
    return {
        id: res.id,
        name: res.name,
        quantity: res.quantity,
        remarks: res?.remarks,
        creator: res.creator.id,
        creatorName: user?.name,
        createdAt: dateToString(res.createdAt!),
        shopList: res.shopList.id,
        shopListStore: listToReturn?.store
    }
}

/**
 * Updated eine ShopItem. Es können nur Name, Quantity und Remarks geändert werden.
 * Aktuell können ShopItems nicht von einem shopItem in einen anderen verschoben werden.
 * Auch kann der Creator nicht geändert werden.
 * Falls die shopItem oder Creator geändert wurde, wird dies ignoriert.
 */
export async function updateShopItem(shopItemResource: ShopItemResource): Promise<ShopItemResource> {
    if (!shopItemResource.id) {
        throw new Error(`No id: ${shopItemResource.id} found, cannot update`);
    }
    const item = await ShopItem.findById(shopItemResource.id).exec();
    if (!item) {
        throw new Error(`No ShopList with id ${shopItemResource.id} found, cannot update`);
    }
    if (shopItemResource.name) item.name = shopItemResource.name;
    if (shopItemResource.quantity) item.quantity = shopItemResource.quantity;
    if (shopItemResource.remarks) item.remarks = shopItemResource.remarks;

    const savedItem = await item.save();
    const res = await savedItem
        .populate<{ creator: IUser & { id: string }, shopList: IShopList & { id: string } }>([
            { path: "creator" },
            { path: "shopList" }
        ])
    const user = await User.findById(res.creator.id).exec()
    const listToReturn = await ShopList.findById(res.shopList.id).exec()
    return {
        id: res.id,
        name: res.name,
        quantity: res.quantity,
        remarks: res.remarks,
        creator: res.creator.id,
        creatorName: user?.name,
        createdAt: dateToString(res.createdAt!),
        shopList: res.shopList.id,
        shopListStore: listToReturn?.store
    }
}

/**
 * Beim Löschen wird das ShopItem über die ID identifiziert.
 * Falls es nicht gefunden wurde (oder aus
 * anderen Gründen nicht gelöscht werden kann) wird ein Fehler geworfen.
 */
export async function deleteShopItem(id: string): Promise<void> {
    const res = await ShopItem.deleteOne({ _id: new Types.ObjectId(id) }).exec()
    if (res.deletedCount !== 1) {
        throw new Error(`No ShopItem with id ${id} deleted, probably id not valid`);
    }
    //await ShopItem.deleteMany({ res: new Types.ObjectId(id)})
}


