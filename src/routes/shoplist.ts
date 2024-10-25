import express from "express";
import { createShopList, deleteShopList, getShopList, updateShopList } from "../../src/services/ShopListService";
import { ShopListResource } from "../Resources";
import { body, matchedData, param, validationResult } from "express-validator";
import { optionalAuthentication, requiresAuthentication } from "./authentication";

const shopListRouter = express.Router()

shopListRouter.post("/",
    requiresAuthentication,
    body('store').isString().isLength({ min: 1, max: 100 }),
    body('public').optional().isBoolean(),
    body('done').optional().isBoolean(),
    body('creator').isMongoId(),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400)
                .json({ errors: errors.array() });
        }
        const shopListResource = matchedData(req) as ShopListResource
        try {
            const createdShopListResource = await createShopList(shopListResource)
            res.status(201).send(createdShopListResource)
        }
        catch (err) {
            if (err instanceof Error) {
                const error = {
                    location: "body",
                    msg: err.message,
                }
                return res.status(400).json({ errors: [error] })
            }
        }
    })

shopListRouter.get("/:shoplistID",
    optionalAuthentication,
    param('shoplistID').isMongoId(),
    async (req, res, next) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400)
                .json({ errors: errors.array() })
        }
        const id = req.params?.shoplistID
        try {
            const shopList = await getShopList(id)
            if (shopList.public == true || shopList.creator == req.userId)
                res.send(shopList)
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
                    return res.status(404).json({ errors: [error] })

            }
        }
    })

shopListRouter.put("/:shoplistID",
    requiresAuthentication,
    param("shoplistID").isMongoId(),
    body('id').isMongoId(),
    body('store').isString().isLength({ min: 1, max: 100 }),
    body('public').isBoolean(),
    body('done').isBoolean(),
    body('creator').isMongoId(),
    async (req, res, next) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400)
                .json({ errors: errors.array() })
        }
        const id = req.params?.shoplistID
        const shopListResource = matchedData(req) as ShopListResource
        if (id !== shopListResource.id) {
            const error = {
                location: "body",
                msg: "Invalid ID",
            }
            return res.status(400).json({ errors: [error] });
        }
        else {
            try {
                const list = await getShopList(id)
                if (list.creator !== req.userId)
                    throw Error("not authorized")
                const updatedShopListResource = await updateShopList(shopListResource)
                res.send(updatedShopListResource)
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

shopListRouter.delete("/:shoplistID",
    requiresAuthentication,
    param('shoplistID').isMongoId(),
    async (req, res, next) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400)
                .json({ errors: errors.array() })
        }
        try {
            const id = req.params?.shoplistID
            const shoplist = await getShopList(id)
            if (shoplist.creator !== req.userId)
                throw Error("not authorized")
            await deleteShopList(id)
            res.send(204)
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
                    return res.status(400).json({ errors: [error] })//404 richti
            }
        }
    })


export default shopListRouter