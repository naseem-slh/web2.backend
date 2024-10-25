import express from "express"
import { createShopItem, deleteShopItem, getShopItem, updateShopItem } from "../services/ShopItemService"
import { ShopItemResource } from "../Resources"
import { body, matchedData, param, validationResult } from "express-validator";
import { optionalAuthentication, requiresAuthentication } from "./authentication";
import { getShopList } from "../services/ShopListService";

const shopItemRouter = express.Router()

shopItemRouter.post("/",
    requiresAuthentication,
    body('name').isString().isLength({ min: 1, max: 100 }),
    body('quantity').isString().isLength({ min: 1, max: 100 }),
    body('remarks').optional().isString().isLength({ min: 1, max: 100 }),
    body('creator').isMongoId(),
    body('shopList').isMongoId(),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400)
                .json({ errors: errors.array() });
        }
        const shopItemResource = matchedData(req) as ShopItemResource
        try {
            const shoplist = await getShopList(shopItemResource.shopList)
            if (shoplist.creator == req.userId || shoplist.public == true) {
                const createdShopItemResource = await createShopItem(shopItemResource)
                res.status(201).send(createdShopItemResource)
            }
            else
                throw Error("not authorized")
        }
        catch (err) {
            if (err instanceof Error) {
                const error = {
                    location: "body",
                    msg: err.message,
                }
                if (err.message === "not authorized")
                    return res.status(403).json({ errors: [error] });
                else
                    return res.status(400).json({ errors: [error] })
            }
        }

    })

shopItemRouter.get("/:shopitemID",
    optionalAuthentication,
    param('shopitemID').isMongoId(),
    async (req, res, next) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400)
                .json({ errors: errors.array() })
        }
        const id = req.params?.shopitemID
        try {
            const shopItem = await getShopItem(id)
            const shoplist = await getShopList(shopItem.shopList)
            if (shoplist.public == true)
                res.send(shopItem)
            else if (shoplist.public == false && shoplist.creator == req.userId || shopItem.creator == req.userId)
                res.send(shopItem)
            else
                throw Error("not authorized")
        }
        catch (err) {
            if (err instanceof Error) {
                const error = {
                    location: "param",
                    msg: err.message,
                }
                if (err.message === "not authorized")
                    return res.status(403).json({ errors: [error] });
                else
                    return res.status(404).json({ errors: [error] })//400 richtig
            }
        }
    })

shopItemRouter.put("/:shopitemID",
    requiresAuthentication,
    param('shopitemID').isMongoId(),
    body('id').isMongoId(),
    body('creator').isMongoId(),
    body('shopList').isMongoId(),
    body('name').isString().isLength({ min: 1, max: 100 }),
    body('quantity').isString().isLength({ min: 1, max: 100 }),
    body('remarks').optional().isString().isLength({ min: 1, max: 100 }),
    async (req, res, next) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400)
                .json({ errors: errors.array() })
        }
        const id = req.params?.shopitemID
        const shopItemResource = matchedData(req) as ShopItemResource
        if (id !== shopItemResource.id) {
            const error = {
                location: "body",
                msg: "Invalid ID",
            }
            return res.status(400).json({ errors: [error] });
        }
        else {
            try {
                const item = await getShopItem(id)
                const shoplist = await getShopList(item.shopList)
                if (shoplist.creator == req.userId || item.creator == req.userId) {
                    const updatedShopItemResource = await updateShopItem(shopItemResource)
                    res.send(updatedShopItemResource)
                }
                else
                    throw Error("not authorized")
            }
            catch (err) {
                if (err instanceof Error) {
                    const error = {
                        location: "body",
                        msg: err.message,
                    }
                    if (err.message === "not authorized")
                        return res.status(403).json({ errors: [error] });
                    else
                        return res.status(400).json({ errors: [error] })
                }
            }
        }
    })

shopItemRouter.delete("/:shopitemID",
    requiresAuthentication,
    param('shopitemID').isMongoId(),
    async (req, res, next) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400)
                .json({ errors: errors.array() })
        }
        try {
            const id = req.params?.shopitemID
            const shopitem = await getShopItem(id)
            const shoplist = await getShopList(shopitem.shopList)
            if (shoplist.creator == req.userId || shopitem.creator == req.userId) {
                await deleteShopItem(id)
                res.send(204)
            }
            else
                throw Error("not authorized")

        } catch (err) {
            if (err instanceof Error) {
                const error = {
                    location: "param",
                    msg: err.message,
                }
                if (err.message === "not authorized")
                    return res.status(403).json({ errors: [error] });
                else
                    return res.status(400).json({ errors: [error] })
            }
        }
    })

export default shopItemRouter