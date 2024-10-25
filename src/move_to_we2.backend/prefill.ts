import { ShopperResource } from "./Resources";
import { User } from "./model/UserModel";
import { createShopItem } from "./services/ShopItemService";
import { createShopList } from "./services/ShopListService";
import { createUser } from "./services/UsersService";

/**
 * Creates user John and some channels and messages in the database.
 * 
 * This is basically for testing, but we place it in the src folder as we want
 * to use it for manual server testing as well. This is only activated when
 * the database is set to memory (DB_CONNECTION_STRING) and
 * DB_PREFILL is true. See index.ts for details.
 */
export async function prefillDB() {
    console.log("Prefill DB with test data: john@some-host.de, 12abcAB!");

    User.syncIndexes();
    createJohnsBoard();
}

/**
 * GEN_CHECK_DATA is true, then we create a board for the frontend checks.
*/
export async function prefillDBWithCheckData() {
    console.log("Prefill DB with check data (dozent@some-host.de, 1234)");
    User.syncIndexes();
    throw new Error("Not implemented yet")
    // createCheckBoard();
}


/**
 * Creates shopper data for the given (or newly created) user.
 * 
 * This is basically for testing, but we place it in the src folder as we want
 * to use it for manual server testing as well.
 * 
 * @return the board resource (which has actually been created in the database)
 */
export async function createJohnsBoard(): Promise<ShopperResource> {

    const john = await createUser({ name: "John", email: "john@some-host.de", password: "12abcAB!", admin: true })
    const johnsID = john.id!;

    const shopper: ShopperResource = { shopLists: [] }
    // private:
    let itemsPerList = [3, 5, 7]
    for (let i = 0; i < itemsPerList.length; i++) {
        const shopList = await createShopList({ store: "John's secret store " + i, public: false, creator: johnsID, done: false })
        for (let m = 0; m < itemsPerList[i]; m++) {
            await createShopItem({ name: "Secret Item " + m, quantity: (m+1) + " kg", creator: johnsID, shopList: shopList.id! })
        }
        shopper.shopLists.push({ ...shopList, shopItemCount: itemsPerList[i] });
    }
    // public:
    itemsPerList = [1, 4, 2, 0]
    for (let i = 0; i < itemsPerList.length; i++) {
        const shopList = await createShopList({ store: "John's store #" + i, public: true, creator: johnsID, done: false })
        for (let m = 0; m < itemsPerList[i]; m++) {
            await createShopItem({ name: "Item " + m, quantity: (m+1) + " kg", creator: johnsID, shopList: shopList.id! })
        }
        shopper.shopLists.push({ ...shopList, shopItemCount: itemsPerList[i] });
    }
    return shopper;
}


// /**
//  * Creates a board for checks of frontend.
//  */
// export async function createCheckBoard(): Promise<BoardResource> {

//     const lecturer = await createUser({ name: "Dozent", email: "dozent@some-host.de", password: "1234", admin: true })
//     const student = await createUser({ name: "Student", email: "student@some-host.de", password: "1234", admin: false })
//     // console.log("Created user John, email john@some-host.de, pass: 1234, for testing purposes.")
//     const lecturerID = lecturer.id!;

//     const board: BoardResource = { channels: [] }
//     // private:
//     let messagesPerChannel = [3, 5, 7]
//     let privChannelNames = ["Ideen", "Plagiate", "Korrekturen"]
//     for (let i = 0; i < messagesPerChannel.length; i++) {
//         const channel = await createChannel({
//             name: privChannelNames[i],
//             description: `Eine Beschreibung für den Channel ${i} schenke ich mir.`, public: false, ownerId: lecturerID, closed: false
//         })
//         for (let m = 0; m < messagesPerChannel[i]; m++) {
//             await createMessage({
//                 title: `Private Message ${m} von Dozent in Channel ${i}`,
//                 content: `So geheim, dass es für die Message ${m} in Channel ${i} gar keinen Inhalt gibt`,
//                 authorId: lecturerID, channelId: channel.id!
//             })
//         }
//         board.channels.push({ ...channel, messageCount: messagesPerChannel[i] });
//     }
//     // public:
//     messagesPerChannel = [2, 4, 0, 1]
//     const channelNames = ["Allgemein", "Fragen", "Aufgaben", "Literatur"]
//     const msgTitles = [
//         ["Organisation", "Klausur"],
//         ["Klausurtermin", "Fertigstellung Korrektur", "Verlängerung Abgabe", "Technik"],
//         [],
//         ["React-Buch"]

//     ]
//     for (let i = 0; i < messagesPerChannel.length; i++) {
//         const channel = await createChannel({
//             name: channelNames[i],
//             description: `Dieser ${i+1}. Channel ist öffentlich.`,
//             public: true, ownerId: lecturerID, closed: false
//         })
//         for (let m = 0; m < messagesPerChannel[i]; m++) {
//             await createMessage({
//                 title: msgTitles[i][m],
//                 content: `Weil es eine Demo ist, ist hier nur generischer Content für die ${m+1}. Message im ${i+1}. Channel.`,
//                 authorId: lecturerID, channelId: channel.id!
//             })
//         }
//         board.channels.push({ ...channel, messageCount: messagesPerChannel[i] });
//     }
//     return board;
// }
