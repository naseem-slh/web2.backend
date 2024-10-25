import express from "express";
import { createUser, deleteUser, updateUser } from "../services/UsersService";
import { UserResource } from "../../src/Resources";
import { body, matchedData, param, validationResult } from "express-validator";
import { requiresAuthentication } from "./authentication";
// Aufbau: Vgl. Folie 119

const userRouter = express.Router();

userRouter.post("/",
    requiresAuthentication,
    body('email').isEmail().normalizeEmail().isLength({ max: 100 }),
    body('admin').isBoolean(),
    body('name').isString().isLength({ min: 1, max: 100 }),
    body('password').isLength({ max: 100 }).isStrongPassword(),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400)
                .json({ errors: errors.array() });
        }
        const userResource = req.body as UserResource;
        try {
            if (req.role === "u")
                throw new Error("no administration rights")
            const createdUserResource = await createUser(userResource);
            res.status(201).send(createdUserResource);
        } catch (err) {
            if (err instanceof Error) {
                const error = {
                    location: "body",
                    msg: err.message,
                }
                if (err.message === "no administration rights") {
                    return res.status(403).json({ errors: [error] });
                } else {
                    return res.status(400).json({ errors: [error] });
                }
            }
        }
    })

userRouter.put("/:userID",
    requiresAuthentication,
    param("userID").isMongoId(),
    body('id').isMongoId(),
    body('email').isEmail().normalizeEmail().isLength({ max: 100 }),
    body('admin').isBoolean(),
    body('name').isString().isLength({ min: 1, max: 100 }),
    body('password').optional().isLength({ max: 100 }).isStrongPassword(),
    async (req, res, next) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400)
                .json({ errors: errors.array() })
        }
        //implementation
        const userID = req.params?.userID
        const userResource = matchedData(req) as UserResource
        if (userID !== userResource.id) {
            const error = {
                location: "body",
                msg: "Invalid ID",
            }
            return res.status(400).json({ errors: [error] });

        } else {
            try {
                if (req.role === "u")
                    throw new Error("no administration rights")
                const updatedUserResource = await updateUser(userResource)
                res.send(updatedUserResource);
            } catch (err) {
                if (err instanceof Error) {
                    const error = {
                        location: "body",
                        msg: err.message,
                    }
                    if (err.message === "no administration rights") {
                        return res.status(403).json({ errors: [error] });
                    } else {
                        return res.status(400).json({ errors: [error] });
                    }
                }
            }
        }
    })

userRouter.delete("/:userID",
    requiresAuthentication,
    param("userID").isMongoId(),
    async (req, res, next) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400)
                .json({ errors: errors.array() })
        }
        //implementation
        try {
            if (req.role === "u")
                throw Error("no administration rights")
            const userID = req.params?.userID;
            if (userID == req.userId)
                throw Error("deletion not authorized")
            await deleteUser(userID);
            res.sendStatus(204)
        } catch (err) {
            if (err instanceof Error) {
                const error = {
                    location: "param",
                    msg: err.message,
                }
                if (err.message === "no administration rights" || err.message === "deletion not authorized") {
                    return res.status(403).json({ errors: [error] });
                } else {
                    return res.status(400).json({ errors: [error] });
                }
            }
        }
    })


export default userRouter;