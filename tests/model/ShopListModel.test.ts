import DB from "../DB";
import { IShopList, ShopList } from "../../src/model/ShopListModel";
import { IUser, User } from "../../src/model/UserModel";
import { HydratedDocument, Types } from "mongoose";

let user: HydratedDocument<IUser>;
let user2: HydratedDocument<IUser>;

beforeAll(async () => await DB.connect())
beforeEach(async () => {
    user = new User(
        {
            email: "john@doe.de",
            name: "John",
            password: "1234"
        });
    await user.save()
    user2 = new User(
        {
            email: "max@doe.de",
            name: "Max",
            password: "1234"
        });
    await user2.save()
})
afterEach(async () => await DB.clear())
afterAll(async () => await DB.close())

test("addShopList defined test", async () => {
    const shopList = new ShopList({ creator: user, store: "lidl" })
    const res = await shopList.save()
    expect(res).toBeDefined();
})

test("Date check defined", async () => {
    const shopList = new ShopList({ creator: user, store: "lidl" })
    const res = await shopList.save()
    expect(res.createdAt).toBeDefined()
})

test("deafault check", async () => {
    const shopList = new ShopList({ creator: user, store: "lidl" })
    const res = await shopList.save()
    expect(res.public).toBe(false)
    expect(res.done).toBe(false)
})

test("no user", async () => {
    try {
        const shopList = new ShopList({ store: "lidl" })
        const res = await shopList.save()
    }
    catch (error) {
        expect(error).toBeInstanceOf(Error)
    }
})

test("Create and retrieve MyShopLIst", async () => {
    const myShopList: HydratedDocument<IShopList> = await ShopList.create({
        creator: user._id, store: "LIDL", public: true
    });

    const myShopListFound: HydratedDocument<IShopList>[] = await ShopList.find({ creator: user._id }).exec();
    expect(myShopListFound.length).toBe(1);
    expect(myShopListFound[0].store).toBe("LIDL");
    expect(myShopListFound[0].public).toBe(true);

    expect(myShopListFound[0].toJSON()).toEqual(myShopList.toJSON());
})

test("Creator multiple Lists", async () => {
    const shopList = new ShopList({ creator: user, store: "lidl" })
    const shopList2 = new ShopList({ creator: user, store: "REWE" })
    const res = await shopList.save()
    const res2 = await shopList2.save()
    expect(res).toBeDefined()
    expect(res2).toBeDefined()
})

test("Type check of user", async () => {
    const shopList = new ShopList({ creator: user, store: "lidl" })
    await shopList.save()
    expect(shopList.creator._id).toBeInstanceOf(Types.ObjectId);
})


test("Delete ShopList", async () => {
    const myShopList: HydratedDocument<IShopList> = await ShopList.create({
        creator: user._id, store: "LIDL", public: true
    });

    let myShopListFound: HydratedDocument<IShopList>[] = await ShopList.find({ creator: user._id }).exec();
    expect(myShopListFound.length).toBe(1);
    myShopList.deleteOne()
    myShopListFound = await ShopList.find({ creator: user._id }).exec();
    expect(myShopListFound.length).toBe(0);
})

test("updateOne and findeOne", async () => {
    const myShopList: HydratedDocument<IShopList> = await ShopList.create({
        creator: user._id, store: "LIDL", public: true
    });

    const updateResult = await ShopList.updateOne({ creator: user._id }, { store: "Kaufland" });
    expect(updateResult.matchedCount).toBe(1);
    expect(updateResult.modifiedCount).toBe(1);
    expect(updateResult.acknowledged).toBeTruthy();

    const u2 = await ShopList.findOne({ creator: user._id }).exec();
    if (!u2) {
        throw new Error("ShopList nicht gefunden")
    }
    expect(u2.store).toBe("Kaufland");
})

test("Question mark operator default test", async () => {
    const shopList = new ShopList({ creator: user, store: "lidl" ,public:undefined})
    const res = await shopList.save()
    expect(res).toBeDefined()
    expect(res.public).toBe(false)
})