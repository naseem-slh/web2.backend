import { Model, model, Query, Schema } from "mongoose"
import bcryptjs from 'bcryptjs'

export interface IUser {
    email: string
    name: string
    password: string
    admin?: boolean
}

 interface IUserMethods {
    isCorrectPassword(password:string): Promise<boolean>
}

type UserModel = Model<IUser, {}, IUserMethods>

const userSchema = new Schema<IUser, UserModel, IUserMethods>({
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    admin: { type: Boolean, default: false, }
})


userSchema.pre("save", async function () {
    if (this.isModified("password")) {
        const hashedPassword = await bcryptjs.hash(this.password, 10)
        this.password = hashedPassword
    }
})

userSchema.pre<Query<any, IUser>>("updateOne", async function () {
    const update = this.getUpdate() as Query<any, IUser> & { password?: string } | null
    if (update?.password) {
        const hashedPassword = await bcryptjs.hash(update.password, 10)
        update.password = hashedPassword
    }
})

userSchema.pre<Query<any, IUser>>("updateMany", async function () {
    const update = this.getUpdate() as Query<any, IUser> & { password?: string } | null
    if (update?.password) {
        const hashedPassword = await bcryptjs.hash(update.password, 10)
        update.password = hashedPassword
    }
})

userSchema.method("isCorrectPassword", async function (password:string): Promise<boolean> {
    if (this.isModified()) {
        throw new Error("User is modified, cannot compare passwords");
    }
    return await bcryptjs.compare(password, this.password)
})

export const User = model<IUser, UserModel>("User", userSchema)