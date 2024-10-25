import { HydratedDocument, ObjectId, Types } from "mongoose";
import { IUser, User } from "../../src/model/UserModel"
import DB from "../DB";
import { IShopList, ShopList } from "../../src/model/ShopListModel";
import { IShopItem, ShopItem } from "../../src/model/ShopItemModel";
import { getShopper } from "../../src/services/ShopperService";
import { getShopList } from "../../src/services/ShopListService";


let max: HydratedDocument<IUser>
let john: HydratedDocument<IUser>
let liste: HydratedDocument<IShopList>
let unusedList: HydratedDocument<IShopList>
let item: HydratedDocument<IShopItem>
let item2: HydratedDocument<IShopItem>
let unusedItem: HydratedDocument<IShopItem>
let publicList: HydratedDocument<IShopList>
let publicUserList: HydratedDocument<IShopList>
let privateList: HydratedDocument<IShopList>





beforeAll(async () => await DB.connect())
beforeEach(async () => {
    //User
    max = await User.create({ name: "Max", email: "max @doe.com", password: "123" });
    john = await User.create({ name: "John", email: "john@doe.com", password: "123" });
    //lists
    liste = await ShopList.create({ creator: max, store: "Lidl" })
    unusedList = await ShopList.create({ creator: max, store: "Schlecker" })
    publicUserList = await ShopList.create({ creator: max, store: "OBI", public: true })
    publicList = await ShopList.create({ creator: john, store: "IKEA", public: true })
    privateList = await ShopList.create({ creator: john, store: "ALDI"})
    //items
    item = await ShopItem.create({ creator: max, shopList: liste, name: "Wasser", quantity: "22" })
    item2 = await ShopItem.create({ creator: max, shopList: liste, name: "H2O", quantity: "2" })
    unusedItem = await ShopItem.create({ creator: max, shopList: unusedList, name: "Milch", quantity: "23" })
})
afterEach(async () => {
    await DB.clear();
})
afterAll(async () => await DB.close())

test("positive test should return maxs lists and public lists", async () => {
//max should have 4 lists
const res = await getShopper(max.id)
    const list1 = await getShopList(liste.id)
    const list2 = await getShopList(unusedList.id)
    const list3 = await getShopList(publicUserList.id)
    const list4 = await getShopList(publicList.id)
    const arr = [list1,list2,list3,list4]
    expect(res.shopLists.length).toBe(4)
    expect(res.shopLists).toEqual(arr)
    expect(res.shopLists[0].shopItemCount).toBe(2)
})

test("no UserId test should return only the 2 public lists", async () => {
    const res = await getShopper()
        const list3 = await getShopList(publicUserList.id)
        const list4 = await getShopList(publicList.id)
        const arr = [list3,list4]
        expect(res.shopLists.length).toBe(2)
        expect(res.shopLists).toEqual(arr)
    })